// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Public type contract for the TLI scores file.
 *
 * Anything in this file is a commitment to the frontend — components consume
 * exactly these shapes. The Python prebuild (`scripts/fetch-scores.py`) is
 * responsible for translating the underlying parquet schema into JSON that
 * satisfies `ScoresFile`. If parquet diverges from this contract, the prebuild
 * does the translation; components never see parquet shape.
 *
 * If you need to add a field, treat it as a contract change: update this file
 * AND the prebuild script in the same PR, with a memo if the change is
 * non-trivial. Don't sneak optional fields in via component logic.
 */

/**
 * NSO 7-region administrative grouping (per NSO Yearbook 2025 Table 1.23,
 * which is the partition the Phase 2 aggregator uses).
 */
export type Region =
  | 'Bangkok and Vicinities'
  | 'Central'
  | 'Eastern'
  | 'Western'
  | 'Northern'
  | 'Northeastern'
  | 'Southern';

/**
 * The 7 categories the Phase 2 aggregator emits in `scores.parquet`.
 * Slugs are the front-end keys; full display labels live in `lookups.ts`.
 *
 *   climate       <- Environment & Climate
 *   healthcare    <- Healthcare
 *   connectivity  <- Connectivity & Transport
 *   economy       <- Cost & Economy            (combined per Phase 2)
 *   safety        <- Safety & Governance
 *   culture       <- Lifestyle & Culture
 *   demographics  <- Demographics & Scale
 */
export type CategoryId =
  | 'climate'
  | 'healthcare'
  | 'connectivity'
  | 'economy'
  | 'safety'
  | 'culture'
  | 'demographics';

export type Locale = 'en' | 'th';

export type QualityFlag = 'fresh' | 'stale' | 'inherited' | 'missing';

export interface Indicator {
  id: string;
  label_en: string;
  label_th: string;
  /** Underlying measurement value, in `unit`. Display-formatted at render. */
  value: number;
  unit: string;
  /** Normalized 0–100 score for this indicator. */
  raw_score: number;
  source: string;
  source_url: string;
  /** ISO 8601 date — when the source-of-record was last refreshed. */
  as_of: string;
  quality_flag: QualityFlag;
  /** Province slug this value was inherited from, when quality_flag === 'inherited'. */
  inherited_from?: string;
}

export interface CategoryScore {
  id: CategoryId;
  /** Aggregated 0–100 category score. May be 0 (real, not missing). */
  score: number;
  indicator_count: number;
  indicators: Indicator[];
  /** Oldest as_of across the category's indicators (ISO 8601). */
  oldest_as_of: string;
  /** Freshest as_of across the category's indicators (ISO 8601). */
  freshest_as_of: string;
}

export interface Province {
  /** URL slug, e.g. 'ayutthaya', 'bangkok'. Latin-only, lowercase. */
  id: string;
  /** ISO 3166-2 administrative code, e.g. 'TH-14'. */
  iso_code: string;
  name_en: string;
  name_th: string;
  region: Region;
  population: number;
  /**
   * Composite 0–100 score. `null` when the province has insufficient
   * coverage to compute a composite. Floored provinces have `composite: 0`
   * and `floored: true`, NOT `null`.
   */
  composite: number | null;
  rank: number;
  floored: boolean;
  floored_by: CategoryId | null;
  /** Coverage tier 1 (full), 2 (partial), 3 (sparse). */
  coverage_tier: 1 | 2 | 3;
  /** Number of categories with full data, 0–7. */
  category_count_full: number;
  categories: Record<CategoryId, CategoryScore>;
}

export interface ScoresFile {
  /** ISO 8601 timestamp when the prebuild emitted this file. */
  generated_at: string;
  /** R2 key (or 'sample-data') the file was generated from, for reproducibility. */
  source_manifest: string;
  /** Methodology version, e.g. 'v1.0'. */
  methodology_version: string;
  /** Phase 2 ingestion_version that produced these scores (for cache-bust + audit). */
  ingestion_version?: string;
  provinces: Province[];
}
