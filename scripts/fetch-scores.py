#!/usr/bin/env python3
"""
Fetch the latest TLI scores and emit src/data/scores.json conforming to
src/data/types.ts.

Two paths:

  1. R2 path (CI + local-with-creds).
     When CLOUDFLARE_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY are
     all set, download:
       - r2://tli-dashboard-data/latest/scores.parquet  (composite + 7 cat scores)
       - r2://tli-lookups/provinces/v1.csv               (canonical province metadata)
     Translate to ScoresFile JSON via DuckDB. Per-indicator detail is NOT
     fetched in this version — category scores ship; indicator-level lands in
     a follow-up that joins r2://tli-derived/<ind>/<iv>/*.parquet.

  2. Sample path (no creds).
     Copy src/data/scores.sample.json to src/data/scores.json. Keeps
     `npm run dev` and `npm run build` working without secrets.

  Backward-compat env names: CLOUDFLARE_ACCOUNT_ID is the canonical name;
  CF_ACCOUNT_ID is also accepted (matches build guide §5.3).

The npm scripts `predev` and `prebuild` invoke this automatically.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
OUT = DATA / "scores.json"
SAMPLE = DATA / "scores.sample.json"

R2_BUCKET_DASHBOARD = "tli-dashboard-data"
R2_KEY_SCORES = "latest/scores.parquet"
R2_BUCKET_LOOKUPS = "tli-lookups"
R2_KEY_PROVINCES = "provinces/v1.csv"
R2_BUCKET_DERIVED = "tli-derived"
INDICATOR_META = ROOT / "src" / "data" / "indicator-meta.json"

# Phase 2 aggregator column → front-end CategoryId
# (see src/data/types.ts and bin/aggregate.py CATEGORIES_ORDER)
CATEGORY_COLUMN_MAP: dict[str, str] = {
    "score_environment_climate": "climate",
    "score_healthcare": "healthcare",
    "score_connectivity_transport": "connectivity",
    "score_cost_economy": "economy",
    "score_safety_governance": "safety",
    "score_lifestyle_culture": "culture",
    "score_demographics_scale": "demographics",
}

# Phase 2 admin_region values are exactly the front-end Region union
# ("Bangkok and Vicinities" | "Central" | "Eastern" | "Western" | "Northern" |
#  "Northeastern" | "Southern"). Pass-through.

# Province slug map — derived from the lookup CSV name_en. We slugify on the fly,
# but pin the well-known historical names so existing routes keep their slugs.
PINNED_SLUGS: dict[str, str] = {
    "Bangkok": "bangkok",
    "Phra Nakhon Si Ayutthaya": "ayutthaya",
}


def slugify(name_en: str) -> str:
    if name_en in PINNED_SLUGS:
        return PINNED_SLUGS[name_en]
    s = name_en.lower()
    # Remove parens content
    if "(" in s:
        s = s.split("(")[0].strip()
    # ASCII transliteration is already done in the lookup; just hyphenate
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_", "/", ".", "'"):
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def get_creds() -> dict[str, str] | None:
    """Return R2 credentials from env, or None if any are missing."""
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
    key = os.environ.get("R2_ACCESS_KEY_ID")
    sec = os.environ.get("R2_SECRET_ACCESS_KEY")
    if acct and key and sec:
        return {"account_id": acct, "key_id": key, "secret": sec}
    return None


def use_sample() -> int:
    if not SAMPLE.exists():
        print(
            f"ERROR: sample data missing at {SAMPLE.relative_to(ROOT)} — cannot "
            "produce scores.json without R2 credentials.",
            file=sys.stderr,
        )
        return 1
    OUT.write_bytes(SAMPLE.read_bytes())
    print(
        f"fetch-scores: wrote {OUT.relative_to(ROOT)} "
        f"from {SAMPLE.relative_to(ROOT)} (R2 credentials not set)"
    )
    return 0


def latest_indicator_keys(s3) -> dict[str, str]:
    """List all r2://tli-derived/ parquets, pick latest by ingestion-version-sort per indicator.

    Keys look like: <ind_id>/<ymd-YYYY-MM-DD-sha-XXXXXXX>/<ind_id>_<ym>.parquet
    Lexicographic sort lines up with chronological order because of the ymd- prefix.
    """
    paginator = s3.get_paginator("list_objects_v2")
    by_indicator: dict[str, list[str]] = {}
    for page in paginator.paginate(Bucket=R2_BUCKET_DERIVED):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if not key.endswith(".parquet"):
                continue
            parts = key.split("/")
            if len(parts) < 3:
                continue
            iid = parts[0]
            by_indicator.setdefault(iid, []).append(key)
    return {iid: sorted(keys)[-1] for iid, keys in by_indicator.items()}


def fetch_indicators(s3, duckdb_module, tmpdir: Path, indicator_meta: dict) -> dict:
    """Download all wired indicator parquets, return {ind_id: {province_code: row_dict}}.

    Only indicators present in indicator_meta are fetched (the 22 wired into
    the composite). Discovered-but-unwired indicators on R2 are skipped.
    """
    print(f"fetch-scores: discovering latest indicator parquets…", flush=True)
    latest = latest_indicator_keys(s3)
    target_ids = sorted(set(indicator_meta.keys()) & set(latest.keys()))
    missing = sorted(set(indicator_meta.keys()) - set(latest.keys()))
    if missing:
        print(f"fetch-scores: WARN — {len(missing)} indicators in meta but not on R2: {missing}")
    print(f"fetch-scores: fetching {len(target_ids)} indicator parquets from R2…", flush=True)

    out: dict[str, dict] = {}
    con = duckdb_module.connect()
    for iid in target_ids:
        key = latest[iid]
        body = s3.get_object(Bucket=R2_BUCKET_DERIVED, Key=key)["Body"].read()
        local = tmpdir / f"{iid}.parquet"
        local.write_bytes(body)
        rows = con.execute(
            f"""SELECT province_code, raw_value, normalized_value,
                       source, source_url, upstream_updated_at, quality_flag
                FROM read_parquet('{local}')"""
        ).fetchall()
        cols = [d[0] for d in con.description]
        out[iid] = {row[0]: dict(zip(cols, row)) for row in rows}
    return out


def fetch_from_r2(creds: dict[str, str]) -> int:
    """Pull scores.parquet + province lookup + 22 indicator parquets, emit ScoresFile JSON."""
    try:
        import boto3  # type: ignore
        import duckdb  # type: ignore
    except ImportError as e:
        print(
            f"fetch-scores: missing Python dependency ({e.name}). "
            "Install via: pip install boto3 duckdb python-dotenv",
            file=sys.stderr,
        )
        return 1

    # Indicator metadata — labels, units, sources, category mapping, weights.
    if not INDICATOR_META.exists():
        print(
            f"fetch-scores: missing {INDICATOR_META.relative_to(ROOT)}. "
            "Regenerate via the extractor in tli-private (out of scope here).",
            file=sys.stderr,
        )
        return 1
    indicator_meta = json.loads(INDICATOR_META.read_text())

    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{creds['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=creds["key_id"],
        aws_secret_access_key=creds["secret"],
        region_name="auto",
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        scores_path = Path(tmpdir) / "scores.parquet"
        provinces_path = Path(tmpdir) / "provinces.csv"

        # --- download scores parquet --------------------------------------
        try:
            body = s3.get_object(Bucket=R2_BUCKET_DASHBOARD, Key=R2_KEY_SCORES)["Body"].read()
        except Exception as e:
            print(f"fetch-scores: failed to download scores.parquet from R2: {e}", file=sys.stderr)
            return 1
        scores_path.write_bytes(body)

        # --- download province lookup CSV --------------------------------
        try:
            lookup_body = s3.get_object(Bucket=R2_BUCKET_LOOKUPS, Key=R2_KEY_PROVINCES)["Body"].read()
        except Exception as e:
            print(f"fetch-scores: failed to download provinces/v1.csv from R2: {e}", file=sys.stderr)
            return 1
        provinces_path.write_bytes(lookup_body)

        con = duckdb.connect()
        rows = con.execute(
            f"""
            SELECT
              s.province_code,
              p.name_en           AS name_en,
              p.name_th           AS name_th,
              p.iso_3166_2        AS iso_code,
              s.admin_region      AS region,
              p.population_2025_dec AS population,
              s.composite_partial AS composite,
              s.is_partial_composite AS is_partial,
              s.n_categories_scored AS cats_scored,
              s.n_categories_total  AS cats_total,
              s.ingestion_version AS ingestion_version,
              s.score_environment_climate    AS score_climate,
              s.score_healthcare             AS score_healthcare,
              s.score_connectivity_transport AS score_connectivity,
              s.score_cost_economy           AS score_economy,
              s.score_safety_governance      AS score_safety,
              s.score_lifestyle_culture      AS score_culture,
              s.score_demographics_scale     AS score_demographics
            FROM read_parquet('{scores_path}') s
            LEFT JOIN read_csv_auto('{provinces_path}', header=true) p
              ON s.province_code = p.province_code
            ORDER BY s.composite_partial DESC NULLS LAST, s.province_code
            """
        ).fetchall()
        col_names = [d[0] for d in con.description]

        # Compute ranks (composite-desc, floored last)
        # First pass: identify floored (any category score == 0 → composite floored)
        records = [dict(zip(col_names, r)) for r in rows]

        def is_floored(r: dict[str, Any]) -> bool:
            for k in ("score_climate", "score_healthcare", "score_connectivity",
                     "score_economy", "score_safety", "score_culture", "score_demographics"):
                if r[k] is not None and r[k] == 0.0:
                    return True
            return False

        # Sort: real-composite-desc first, floored last
        def sort_key(r: dict[str, Any]) -> tuple:
            floored = is_floored(r)
            comp = r["composite"] if r["composite"] is not None else -1
            # Floored sorts last (1), real sorts first (0)
            return (1 if floored else 0, -comp)

        records.sort(key=sort_key)

        # Find the ingestion_version (should be uniform across rows)
        ingestion_version = next((r["ingestion_version"] for r in records if r["ingestion_version"]), None)

        # --- download all 22 wired indicator parquets, group by province ---
        indicator_data = fetch_indicators(s3, duckdb, Path(tmpdir), indicator_meta)

        provinces_out: list[dict[str, Any]] = []
        cat_keys = [
            ("climate", "score_climate"),
            ("healthcare", "score_healthcare"),
            ("connectivity", "score_connectivity"),
            ("economy", "score_economy"),
            ("safety", "score_safety"),
            ("culture", "score_culture"),
            ("demographics", "score_demographics"),
        ]
        # Pre-compute: which indicator IDs feed which front-end category?
        category_indicators: dict[str, list[str]] = {}
        for iid, meta in indicator_meta.items():
            category_indicators.setdefault(meta["category"], []).append(iid)

        # Quality flag normalization: aggregator emits "ok" for fresh; map to types.ts.
        def map_quality(q: str | None) -> str:
            if q is None:
                return "fresh"
            q = q.lower()
            if q in ("ok", "fresh", "valid"):
                return "fresh"
            if q in ("partial", "stale"):
                return "stale"
            if q in ("inherited",):
                return "inherited"
            if q in ("missing", "null", "no_data"):
                return "missing"
            return "fresh"

        for rank, r in enumerate(records, start=1):
            floored = is_floored(r)
            floored_by: str | None = None
            if floored:
                for cat_id, col in cat_keys:
                    if r[col] is not None and r[col] == 0.0:
                        floored_by = cat_id
                        break

            province_code = r["province_code"]
            categories: dict[str, Any] = {}
            scored_count = 0

            for cat_id, col in cat_keys:
                score = r[col]
                if score is None:
                    score_value = 0.0
                else:
                    score_value = round(float(score), 1)
                    scored_count += 1

                # Indicators in this category for this province
                ind_list = []
                as_of_dates: list[str] = []
                for iid in category_indicators.get(cat_id, []):
                    meta = indicator_meta[iid]
                    province_rows = indicator_data.get(iid, {})
                    row = province_rows.get(province_code)
                    if row is None:
                        # Province has no value for this indicator — skip rather than fake
                        continue
                    raw_val = row.get("raw_value")
                    norm_val = row.get("normalized_value")
                    as_of = (row.get("upstream_updated_at") or "").strip()
                    if as_of:
                        as_of_dates.append(as_of)
                    ind_list.append({
                        "id": iid,
                        "label_en": meta["label_en"],
                        "label_th": meta["label_th"] or meta["label_en"],
                        "value": float(raw_val) if raw_val is not None else 0.0,
                        "unit": meta["unit"],
                        "raw_score": round(float(norm_val), 1) if norm_val is not None else 0.0,
                        "source": meta["source"] or row.get("source", ""),
                        "source_url": meta["source_url"] or row.get("source_url", ""),
                        "as_of": as_of[:10] if as_of else "",
                        "quality_flag": map_quality(row.get("quality_flag")),
                    })

                if as_of_dates:
                    as_of_sorted = sorted(d for d in as_of_dates if d)
                    oldest = as_of_sorted[0][:10] if as_of_sorted else ""
                    freshest = as_of_sorted[-1][:10] if as_of_sorted else ""
                else:
                    oldest = freshest = ""

                categories[cat_id] = {
                    "id": cat_id,
                    "score": score_value,
                    "indicator_count": len(ind_list),
                    "oldest_as_of": oldest,
                    "freshest_as_of": freshest,
                    "indicators": ind_list,
                }

            # Coverage tier from cats_scored
            cats_scored_n = r["cats_scored"] or 0
            coverage_tier = 1 if cats_scored_n == 7 else (2 if cats_scored_n >= 4 else 3)

            province = {
                "id": slugify(r["name_en"] or ""),
                "iso_code": r["iso_code"] or "",
                "name_en": r["name_en"] or "",
                "name_th": r["name_th"] or "",
                "region": r["region"] or "Central",
                "population": int(r["population"] or 0),
                "composite": (
                    None if r["composite"] is None else (0 if floored else round(float(r["composite"]), 1))
                ),
                "rank": rank,
                "floored": floored,
                "floored_by": floored_by,
                "coverage_tier": coverage_tier,
                "category_count_full": int(cats_scored_n),
                "categories": categories,
            }
            provinces_out.append(province)

        out = {
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source_manifest": f"r2://{R2_BUCKET_DASHBOARD}/{R2_KEY_SCORES}",
            "methodology_version": "v1.0",
            "ingestion_version": ingestion_version,
            "provinces": provinces_out,
        }

        OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
        print(
            f"fetch-scores: wrote {OUT.relative_to(ROOT)} from R2 "
            f"({len(provinces_out)} provinces, ingestion {ingestion_version})"
        )
        return 0


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    creds = get_creds()
    if creds is None:
        return use_sample()
    return fetch_from_r2(creds)


if __name__ == "__main__":
    sys.exit(main())
