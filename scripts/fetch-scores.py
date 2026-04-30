#!/usr/bin/env python3
"""
Fetch the latest TLI scores and emit src/data/scores.json conforming to
the contract in src/data/types.ts.

Two paths:

  1. R2 path (CI / PR 3 onward).
     When CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are all
     set, download r2://tli-dashboard-data/latest/scores.parquet and
     translate it to ScoresFile JSON via DuckDB.

  2. Sample path (local dev, default).
     When R2 credentials are missing, copy src/data/scores.sample.json to
     src/data/scores.json. This keeps `npm run dev` and `npm run build`
     working on a fresh clone without secrets.

The npm scripts `predev` and `prebuild` invoke this automatically. You can
also run it directly:

    python3 scripts/fetch-scores.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
OUT = DATA / "scores.json"
SAMPLE = DATA / "scores.sample.json"


def have_r2_creds() -> bool:
    return all(
        os.environ.get(k)
        for k in ("CF_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
    )


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


def fetch_from_r2() -> int:
    raise NotImplementedError(
        "R2 fetch is not wired in PR 2 (feat/data-pipeline). "
        "PR 3 (feat/ci-deploy) implements: boto3 download of "
        "r2://tli-dashboard-data/latest/scores.parquet, DuckDB join with the "
        "indicator dictionary, and translation to the ScoresFile shape in "
        "src/data/types.ts. Until then, leave R2 credentials unset locally."
    )


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    if not have_r2_creds():
        return use_sample()
    return fetch_from_r2()


if __name__ == "__main__":
    sys.exit(main())
