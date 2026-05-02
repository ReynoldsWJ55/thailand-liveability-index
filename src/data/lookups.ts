// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Lookups for category metadata and locale-aware chrome labels.
 *
 * Anything that needs to be translated for `/th/` chrome lives here so the
 * province page template stays locale-agnostic. Province content (names,
 * indicator labels) lives in scores.json, not here.
 */
import type { CategoryId, Locale, Region } from './types';

export interface CategoryMeta {
  id: CategoryId;
  label_en: string;
  label_th: string;
  /** Lucide icon name (must be registered in src/components/Lucide.astro). */
  icon: string;
  /** CSS class for the colored category dot. */
  cssClass: string;
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  climate: {
    id: 'climate',
    label_en: 'Environment & Climate',
    label_th: 'สิ่งแวดล้อมและภูมิอากาศ',
    icon: 'cloud-sun',
    cssClass: 'cat-climate',
  },
  healthcare: {
    id: 'healthcare',
    label_en: 'Healthcare',
    label_th: 'การดูแลสุขภาพ',
    icon: 'cross',
    cssClass: 'cat-healthcare',
  },
  connectivity: {
    id: 'connectivity',
    label_en: 'Connectivity & Transport',
    label_th: 'การคมนาคมและการเชื่อมต่อ',
    icon: 'route',
    cssClass: 'cat-connectivity',
  },
  economy: {
    id: 'economy',
    label_en: 'Cost & Economy',
    label_th: 'ค่าครองชีพและเศรษฐกิจ',
    icon: 'trending-up',
    cssClass: 'cat-economy',
  },
  safety: {
    id: 'safety',
    label_en: 'Safety & Governance',
    label_th: 'ความปลอดภัยและธรรมาภิบาล',
    icon: 'shield',
    cssClass: 'cat-safety',
  },
  culture: {
    id: 'culture',
    label_en: 'Lifestyle & Culture',
    label_th: 'วิถีชีวิตและวัฒนธรรม',
    icon: 'users-round',
    cssClass: 'cat-culture',
  },
  demographics: {
    id: 'demographics',
    label_en: 'Demographics & Scale',
    label_th: 'ประชากรและขนาดเมือง',
    icon: 'users',
    cssClass: 'cat-demographics',
  },
};

/** Canonical render order across the site (matches Phase 2 aggregator order). */
export const CATEGORY_ORDER: CategoryId[] = [
  'climate',
  'healthcare',
  'connectivity',
  'economy',
  'safety',
  'culture',
  'demographics',
];

/**
 * Category anchor slugs for in-page navigation.
 *
 * Internal `category.id` (e.g. `climate`) is preserved for code; URL anchors
 * use the SEO-friendly slug derived from the canonical EN label. Locked per
 * `99-meta/seo-slug-audit-2026-05-02.md` §2.
 */
export const CATEGORY_ANCHOR: Record<CategoryId, string> = {
  climate: 'environment-climate',
  healthcare: 'healthcare',
  connectivity: 'connectivity-transport',
  economy: 'cost-economy',
  safety: 'safety-governance',
  culture: 'lifestyle-culture',
  demographics: 'demographics-scale',
};

/**
 * Indicator display order within categories.
 *
 * Sort key for the indicator-detail tables on province pages. Within each
 * category, indicators render in the order listed below — keeps topically-
 * paired indicators adjacent (PM2.5 mean + days-exceeding-WHO; forest cover
 * + tree canopy; fixed broadband + mobile broadband; etc.) instead of
 * the upstream-order which scatters them. Indicators NOT listed fall back
 * to the end via Number.MAX_SAFE_INTEGER rank.
 *
 * Per Block 1 polish-pass item 7.
 */
export const INDICATOR_DISPLAY_ORDER: string[] = [
  // Environment & Climate
  'ind_pm25_annual_mean',
  'ind_pm25_days_exceeding_who',
  'ind_forest_cover_pct',
  'ind_tree_canopy_pct',
  'ind_heat_days_35c',
  'ind_rainfall_days_per_year',
  'ind_flood_frequency',
  'ind_piped_water_pct',
  'ind_waste_management_score',
  // Healthcare
  'ind_hospital_beds_per_1k',
  'ind_hospitals_per_100k',
  'ind_jci_accredited_count',
  'ind_rpsto_per_10k_total',
  // Connectivity & Transport
  'ind_internet_fixed_mbps',
  'ind_internet_mobile_mbps',
  'ind_walkability_score',
  'ind_public_transport_access',
  'ind_rail_access',
  'ind_airport_intl_drive_min',
  // Cost & Economy
  'ind_gpp_per_capita',
  // Safety & Governance
  'ind_acled_events_per_100k_5yr',
  'ind_acled_fatalities_per_100k_5yr',
  // Lifestyle & Culture
  'ind_tat_events_per_100k',
  'ind_unesco_whs_count',
  // Demographics & Scale
  'ind_population_density',
];

/** Lookup helper: rank for sort. Returns Number.MAX_SAFE_INTEGER for unlisted indicators (fallback to end). */
export function indicatorDisplayRank(id: string): number {
  const idx = INDICATOR_DISPLAY_ORDER.indexOf(id);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/**
 * Indicator URL slug map.
 *
 * Internal `ind_*` IDs are preserved for the data pipeline (R2 parquets,
 * indicator-meta.json, scores.json all key on these). Public URLs use the
 * SEO-friendly slug. Locked per `99-meta/seo-slug-audit-2026-05-02.md` §3,
 * with the GPP override per Will's sign-off (spell out `gross-provincial-
 * product-per-capita` instead of `gpp-per-capita`).
 *
 * 25 entries — must match `indicator-meta.json` keys.
 */
export const SLUG_MAP: Record<string, string> = {
  ind_acled_events_per_100k_5yr: 'conflict-events-per-100k',
  ind_acled_fatalities_per_100k_5yr: 'conflict-fatalities-per-100k',
  ind_airport_intl_drive_min: 'international-airport-access',
  ind_flood_frequency: 'flood-frequency',
  ind_forest_cover_pct: 'forest-cover',
  ind_gpp_per_capita: 'gross-provincial-product-per-capita',
  ind_heat_days_35c: 'heat-days-35c',
  ind_hospital_beds_per_1k: 'hospital-beds-per-1000',
  ind_hospitals_per_100k: 'hospitals-per-100k',
  ind_internet_fixed_mbps: 'fixed-broadband-speed',
  ind_internet_mobile_mbps: 'mobile-broadband-speed',
  ind_jci_accredited_count: 'jci-accredited-hospitals',
  ind_piped_water_pct: 'piped-water-coverage',
  ind_pm25_annual_mean: 'pm25-annual-mean',
  ind_pm25_days_exceeding_who: 'pm25-days-exceeding-who',
  ind_population_density: 'population-density',
  ind_public_transport_access: 'public-transport-access',
  ind_rail_access: 'rail-access',
  ind_rainfall_days_per_year: 'rainfall-days-per-year',
  ind_rpsto_per_10k_total: 'subdistrict-health-clinics-per-10k',
  ind_tat_events_per_100k: 'tourism-cultural-events-per-100k',
  ind_tree_canopy_pct: 'tree-canopy-coverage',
  ind_unesco_whs_count: 'unesco-world-heritage-sites',
  ind_walkability_score: 'walkability-score',
  ind_waste_management_score: 'waste-management',
};

/** Reverse lookup: SEO slug → internal indicator id. Useful for redirect handling and deserialization. */
export const SLUG_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_MAP).map(([id, slug]) => [slug, id]),
);

export function categoryLabel(id: CategoryId, locale: Locale): string {
  return locale === 'th' ? CATEGORIES[id].label_th : CATEGORIES[id].label_en;
}

const REGION_LABELS_TH: Record<Region, string> = {
  'Bangkok and Vicinities': 'กรุงเทพและปริมณฑล',
  Central: 'ภาคกลาง',
  Eastern: 'ภาคตะวันออก',
  Western: 'ภาคตะวันตก',
  Northern: 'ภาคเหนือ',
  Northeastern: 'ภาคตะวันออกเฉียงเหนือ',
  Southern: 'ภาคใต้',
};

const REGION_LABELS_EN_SHORT: Record<Region, string> = {
  'Bangkok and Vicinities': 'Bangkok & Vicinities',
  Central: 'Central Thailand',
  Eastern: 'Eastern Thailand',
  Western: 'Western Thailand',
  Northern: 'Northern Thailand',
  Northeastern: 'Northeastern Thailand',
  Southern: 'Southern Thailand',
};

export function regionLabel(region: Region, locale: Locale): string {
  return locale === 'th' ? REGION_LABELS_TH[region] : REGION_LABELS_EN_SHORT[region];
}

/** Page-chrome labels — kept here so they're easy to revise in one place. */
export interface ChromeLabels {
  province: string;
  residents: (n: number) => string;
  composite: string;
  rankOf77: (rank: number) => string;
  asOf: string;
  fullCoverage: (full: number, total: number) => string;
  byCategory: string;
  indicatorCount: (n: number) => string;
  indicatorDetail: string;
  indicator: string;
  value: string;
  score0to100: string;
  source: string;
  asOfHeader: string;
  noData: string;
  inheritedFrom: (slug: string) => string;
  flooredBy: (label: string) => string;
  methodology: string;
  homeCrumb: string;
  provincesCrumb: string;
  // Home / map / grid chrome
  mapAriaLabel: string;
  legendAriaLabel: string;
  flooredShort: string;
  clickToView: string;
  homeTitle: string;
  homeDescription: string;
  homeEyebrow: string[];
  homeLede: string;
  thailandAtAGlance: string;
  thailandAtAGlanceSub: string;
  curatedTitle: string;
  curatedSub: string;
  curatedTag: string;
  all77Title: string;
  all77Sub: string;
  topFiveEyebrow: string;
  flooredRowOne: (n: number) => string;
  flooredRowMany: (n: number) => string;
  whyArrow: string;
  showingOf: (shown: number, total: number) => string;
  filterRegion: string;
  filterCoverage: string;
  filterCategory: string;
  filterSort: string;
  filterAny: string;
  filterAll: string;
  tier1Full: string;
  tier2Partial: string;
  sortCompositeDesc: string;
  sortCompositeAsc: string;
  sortName: string;
  leadsOn: string;
  citationsCompositeMethod: string;
  citationsScale: string;
  howCompositeBuilt: string;
  /** Shown when a category card has zero indicators in this build (R2 wiring lands category scores first; per-indicator detail follows). */
  indicatorsComingSoon: string;
  /** N/A pill text — applicability-override display for indicators structurally inappropriate to the province type. */
  naLabel: string;
  /** Generic title fallback when an N/A pill has no per-indicator rationale. Per-indicator rationale comes from `applicability_overrides.ts`. */
  naTooltipFallback: string;
  /** Methodology-honest note above categories with overridden indicators on a province page. `provinceName` is interpolated; `indicatorList` is a comma-joined list of indicator labels. */
  urbanNaNote: (provinceName: string, indicatorList: string) => string;
}

export const CHROME: Record<Locale, ChromeLabels> = {
  en: {
    province: 'PROVINCE',
    residents: (n) => `${n.toLocaleString('en-US')} RESIDENTS`,
    composite: 'COMPOSITE SCORE',
    rankOf77: (rank) => `ranks ${rank} of 77 provinces`,
    asOf: 'AS OF',
    fullCoverage: (full, total) => `${full} / ${total} CATEGORIES`,
    byCategory: 'By category',
    indicatorCount: (n) => `${n} indicator${n === 1 ? '' : 's'}`,
    indicatorDetail: 'indicator detail',
    indicator: 'Indicator',
    value: 'Value',
    score0to100: 'Score 0–100',
    source: 'Source',
    asOfHeader: 'As of',
    noData: 'NO DATA',
    inheritedFrom: (slug) => `↳ INHERITED FROM ${slug.toUpperCase().replace(/-/g, ' ')}`,
    flooredBy: (label) => `FLOORED · ${label.toUpperCase()}`,
    methodology: 'Methodology',
    homeCrumb: 'Home',
    provincesCrumb: 'Provinces',
    mapAriaLabel: "Choropleth map of Thailand's 77 provinces colored by composite liveability score",
    legendAriaLabel: 'Composite score legend',
    flooredShort: 'floored',
    clickToView: 'Click to view →',
    homeTitle: 'Thailand Liveability Index',
    homeDescription: 'A composite 0–100 liveability score for each of Thailand\'s 77 provinces — seven categories, transparent methodology, full provenance on every number.',
    homeEyebrow: ['77 Provinces', '7 Categories', 'Composite 0–100'],
    homeLede: 'A composite 0–100 score across 7 categories, calculated as a geometric mean — so a province that scores 0 in any single category is honestly floored at 0 overall, not averaged away.',
    thailandAtAGlance: 'Thailand at a glance',
    thailandAtAGlanceSub: 'Each province is colored by its composite score. Hover for the score, click through for the full province card.',
    curatedTitle: 'Provinces people search for',
    curatedSub: 'Five recognizable destinations pinned for context. Their composite ranks vary widely — the data is the whole point.',
    curatedTag: 'Curated · top-of-mind',
    all77Title: 'All 77 provinces',
    all77Sub: 'Sorted by composite score. Each tile shows rank, score, and the category that province leads on.',
    topFiveEyebrow: 'Top 5 by composite',
    flooredRowOne: (n) => `${n} province is floored at 0 — geometric-mean methodology means a single category at 0 zeros the composite. Shown below, not hidden.`,
    flooredRowMany: (n) => `${n} provinces are floored at 0 — geometric-mean methodology means a single category at 0 zeros the composite. Shown below, not hidden.`,
    whyArrow: 'Why →',
    showingOf: (shown, total) => `Showing ${shown} of ${total}`,
    filterRegion: 'Region',
    filterCoverage: 'Coverage',
    filterCategory: 'Category leader',
    filterSort: 'Sort',
    filterAny: 'Any',
    filterAll: 'All',
    tier1Full: 'Tier 1 · Full',
    tier2Partial: 'Tier 2 · Partial',
    sortCompositeDesc: 'Composite ↓',
    sortCompositeAsc: 'Composite ↑',
    sortName: 'A–Z',
    leadsOn: 'leads on',
    citationsCompositeMethod: 'Composite · geometric mean of 7 categories',
    citationsScale: 'Scale · 0–100 (normalized)',
    howCompositeBuilt: 'How the composite is built →',
    indicatorsComingSoon: 'Indicator-level detail lands in a follow-up release.',
    naLabel: 'N/A',
    naTooltipFallback: 'This indicator is structurally inappropriate to this province type. See methodology.',
    urbanNaNote: (provinceName, indicatorList) =>
      `${provinceName} scores low on some indicators (${indicatorList}) that don't fit a fully urban province. The proper methodology fix is queued for v1.2 — see the smell-test review queue.`,
  },
  th: {
    province: 'จังหวัด',
    residents: (n) => `ประชากร ${n.toLocaleString('en-US')} คน`,
    composite: 'คะแนนรวม',
    rankOf77: (rank) => `อันดับ ${rank} จาก 77 จังหวัด`,
    asOf: 'ณ',
    fullCoverage: (full, total) => `${full} / ${total} หมวด`,
    byCategory: 'ตามหมวดหมู่',
    indicatorCount: (n) => `${n} ตัวชี้วัด`,
    indicatorDetail: 'รายละเอียดตัวชี้วัด',
    indicator: 'ตัวชี้วัด',
    value: 'ค่า',
    score0to100: 'คะแนน 0–100',
    source: 'แหล่ง',
    asOfHeader: 'ณ',
    noData: 'ไม่มีข้อมูล',
    inheritedFrom: (slug) => `↳ ใช้ค่าจาก ${slug.toUpperCase().replace(/-/g, ' ')}`,
    flooredBy: (label) => `ติดเพดาน · ${label.toUpperCase()}`,
    methodology: 'ระเบียบวิธี',
    homeCrumb: 'หน้าหลัก',
    provincesCrumb: 'จังหวัด',
    mapAriaLabel: 'แผนที่ choropleth ของ 77 จังหวัด แสดงคะแนนคุณภาพการอยู่อาศัย',
    legendAriaLabel: 'คำอธิบายช่วงคะแนน',
    flooredShort: 'ติดเพดาน',
    clickToView: 'คลิกเพื่อดู →',
    homeTitle: 'ดัชนีคุณภาพการอยู่อาศัยของประเทศไทย',
    homeDescription: 'คะแนนคุณภาพการอยู่อาศัย 0–100 สำหรับ 77 จังหวัด — 7 หมวด ระเบียบวิธีโปร่งใส แหล่งที่มาของทุกตัวเลข',
    homeEyebrow: ['77 จังหวัด', '7 หมวดหมู่', 'คะแนนรวม 0–100'],
    homeLede: 'คะแนนรวม 0–100 จาก 7 หมวดหมู่ คำนวณด้วยค่าเฉลี่ยเรขาคณิต — จังหวัดใดได้ 0 ในหมวดใดหมวดหนึ่ง คะแนนรวมจะถูกตรึงไว้ที่ 0 อย่างซื่อสัตย์ ไม่ใช่หาค่าเฉลี่ยกลบ',
    thailandAtAGlance: 'ภาพรวมประเทศไทย',
    thailandAtAGlanceSub: 'แต่ละจังหวัดระบายสีตามคะแนนรวม วางเมาส์เพื่อดูคะแนน คลิกเพื่อดูรายละเอียด',
    curatedTitle: 'จังหวัดที่คนค้นหาบ่อย',
    curatedSub: 'จุดหมายห้าจังหวัดที่คนรู้จักดีพอที่จะค้นหา อันดับคะแนนรวมแตกต่างกันมาก ข้อมูลคือคำตอบ',
    curatedTag: 'คัดสรร · ระดับท็อป',
    all77Title: '77 จังหวัดทั้งหมด',
    all77Sub: 'จัดเรียงตามคะแนนรวม แต่ละกระเบื้องแสดงอันดับ คะแนน และหมวดที่จังหวัดนั้นเด่น',
    topFiveEyebrow: '5 อันดับแรกตามคะแนนรวม',
    flooredRowOne: (n) => `${n} จังหวัดติดเพดานที่ 0 — กฎไม่ทดแทนกันของค่าเฉลี่ยเรขาคณิตทำให้หมวดใดได้ 0 คะแนนรวมจะเป็น 0 แสดงไว้ด้านล่าง ไม่ซ่อน`,
    flooredRowMany: (n) => `${n} จังหวัดติดเพดานที่ 0 — กฎไม่ทดแทนกันของค่าเฉลี่ยเรขาคณิตทำให้หมวดใดได้ 0 คะแนนรวมจะเป็น 0 แสดงไว้ด้านล่าง ไม่ซ่อน`,
    whyArrow: 'เหตุใด →',
    showingOf: (shown, total) => `แสดง ${shown} จาก ${total}`,
    filterRegion: 'ภูมิภาค',
    filterCoverage: 'ความครอบคลุม',
    filterCategory: 'หมวดเด่น',
    filterSort: 'จัดเรียง',
    filterAny: 'ทั้งหมด',
    filterAll: 'ทั้งหมด',
    tier1Full: 'ระดับ 1 · ครบ',
    tier2Partial: 'ระดับ 2 · บางส่วน',
    sortCompositeDesc: 'คะแนนรวม ↓',
    sortCompositeAsc: 'คะแนนรวม ↑',
    sortName: 'ก–ฮ',
    leadsOn: 'เด่นด้าน',
    citationsCompositeMethod: 'คะแนนรวม · ค่าเฉลี่ยเรขาคณิตของ 7 หมวด',
    citationsScale: 'ช่วง · 0–100 (ปรับมาตรฐาน)',
    howCompositeBuilt: 'การคำนวณคะแนนรวม →',
    indicatorsComingSoon: 'รายละเอียดระดับตัวชี้วัดจะมาในรุ่นถัดไป',
    naLabel: 'N/A',
    naTooltipFallback: 'ตัวชี้วัดนี้ไม่เหมาะกับจังหวัดประเภทนี้โดยโครงสร้าง ดูระเบียบวิธี',
    urbanNaNote: (provinceName, indicatorList) =>
      `${provinceName}ได้คะแนนต่ำในตัวชี้วัดบางตัว (${indicatorList}) ที่ไม่เหมาะกับจังหวัดที่เป็นเขตเมืองทั้งหมด การแก้ไขระเบียบวิธีที่เหมาะสมจะอยู่ในรุ่น v1.2 — ดูคิวตรวจสอบ smell-test`,
  },
};

/**
 * Plain-language indicator descriptions — keyed by indicator id.
 *
 * Used in the indicator-card "What this measures" block. Format on the page:
 *   "{ProvinceName} has a {indicator label} of {value} {unit}. {description}"
 *
 * Description writing rules:
 * - 1-2 sentences, plain language (no jargon)
 * - Always state directionality ("higher is better" / "lower is better")
 * - Mention the underlying concept, not just the metric (e.g. "PM2.5 is fine
 *   particulate matter linked to respiratory and cardiovascular harm")
 *
 * v0.1 ships English descriptions; Thai ones use a short fallback. Native-Thai-
 * fluent reviewer pass queued in operator queue. v1.2 spike (June) will refine.
 */
export const INDICATOR_PLAIN_DESCRIPTIONS: Record<string, { en: string; th: string }> = {
  ind_acled_events_per_100k_5yr: {
    en: 'Cumulative count over the past five years of armed-conflict events recorded by the Armed Conflict Location & Event Data Project, normalized per 100,000 residents. Lower is safer.',
    th: 'จำนวนเหตุการณ์ความขัดแย้งทางอาวุธในรอบ 5 ปี ต่อประชากร 100,000 คน ค่าต่ำดีกว่า',
  },
  ind_acled_fatalities_per_100k_5yr: {
    en: 'Cumulative fatalities over the past five years from armed-conflict events recorded by ACLED, normalized per 100,000 residents. Lower is safer.',
    th: 'จำนวนผู้เสียชีวิตจากเหตุการณ์ความขัดแย้งในรอบ 5 ปี ต่อประชากร 100,000 คน ค่าต่ำดีกว่า',
  },
  ind_airport_intl_drive_min: {
    en: "Driving time in minutes from the province's main population centre to the nearest international airport, derived from OpenStreetMap road data. Shorter drive times improve connectivity for residents and inbound travel.",
    th: 'เวลาขับรถ (นาที) จากศูนย์กลางจังหวัดถึงสนามบินนานาชาติที่ใกล้ที่สุด ค่าต่ำดีกว่า',
  },
  ind_flood_frequency: {
    en: 'Provincial cabinet-resolution flood-aid requests per 100,000 residents (annual baseline), reflecting the frequency of declared flood disasters severe enough to trigger central-government aid. Lower is better.',
    th: 'จำนวนคำร้องขอความช่วยเหลือกรณีน้ำท่วมที่คณะรัฐมนตรีรับรอง ต่อประชากร 100,000 คน ค่าต่ำดีกว่า',
  },
  ind_forest_cover_pct: {
    en: "Percentage of provincial land area classified as forest by the Royal Forest Department's administrative survey (republished by the National Statistical Office). Higher cover supports biodiversity, carbon storage, and microclimate stability.",
    th: 'สัดส่วนพื้นที่ป่าของจังหวัด ตามข้อมูลกรมป่าไม้ ค่าสูงดีกว่า',
  },
  ind_gpp_per_capita: {
    en: 'Gross Provincial Product per capita in Thai baht — total economic output produced within the province divided by population. Higher values indicate stronger local economic activity and tax base.',
    th: 'ผลิตภัณฑ์มวลรวมจังหวัดต่อหัว (บาท) ค่าสูงดีกว่า',
  },
  ind_heat_days_35c: {
    en: 'Annual count of days with maximum temperature reaching or exceeding 35°C, from NASA POWER reanalysis. More heat days indicate higher heat-stress risk for outdoor workers, infrastructure, and energy demand.',
    th: 'จำนวนวันที่อุณหภูมิสูงสุด ≥ 35°C ต่อปี ค่าต่ำดีกว่า',
  },
  ind_hospital_beds_per_1k: {
    en: 'Registered hospital beds per 1,000 residents, from Ministry of Public Health hospital registry. Higher capacity supports inpatient care and surge response.',
    th: 'จำนวนเตียงโรงพยาบาลที่ขึ้นทะเบียน ต่อประชากร 1,000 คน ค่าสูงดีกว่า',
  },
  ind_hospitals_per_100k: {
    en: 'Hospital-grade healthcare facilities (community, general, and tertiary hospitals) per 100,000 residents. Higher density reduces travel time to advanced care.',
    th: 'จำนวนสถานพยาบาลระดับโรงพยาบาล ต่อประชากร 100,000 คน ค่าสูงดีกว่า',
  },
  ind_internet_fixed_mbps: {
    en: 'Median provincial fixed-line broadband download speed in megabits per second, from Ookla Speedtest open data. Higher speeds support remote work, e-commerce, and digital services.',
    th: 'ความเร็วบรอดแบนด์แบบมีสายเฉลี่ย (Mbps) ค่าสูงดีกว่า',
  },
  ind_internet_mobile_mbps: {
    en: 'Median provincial mobile broadband download speed in megabits per second, from Ookla Speedtest open data. Higher speeds matter most for residents and travellers without fixed-line access.',
    th: 'ความเร็วอินเทอร์เน็ตมือถือเฉลี่ย (Mbps) ค่าสูงดีกว่า',
  },
  ind_jci_accredited_count: {
    en: 'Count of hospitals in the province accredited by Joint Commission International, the leading global standard for healthcare quality. JCI accreditation is a strong signal of medical-tourism-grade care.',
    th: 'จำนวนโรงพยาบาลที่ได้รับการรับรองจาก Joint Commission International (JCI) ค่าสูงดีกว่า',
  },
  ind_piped_water_pct: {
    en: 'Percentage of households with inside piped-water supply on the premises, from National Statistical Office household survey data. Higher coverage improves health, sanitation, and time saved on water collection.',
    th: 'สัดส่วนครัวเรือนที่มีน้ำประปาภายในบ้าน ค่าสูงดีกว่า',
  },
  ind_pm25_annual_mean: {
    en: 'Annual mean concentration of fine particulate matter (PM2.5) in micrograms per cubic meter, from OpenAQ aggregating Pollution Control Department feeds. PM2.5 particles penetrate deep into the lungs and bloodstream and are linked to respiratory and cardiovascular disease. Lower is better; the WHO 2021 guideline is 5 µg/m³.',
    th: 'ค่าเฉลี่ยรายปีของฝุ่นละอองขนาดเล็กกว่า 2.5 ไมครอน (PM2.5) (µg/m³) ค่าต่ำดีกว่า',
  },
  ind_pm25_days_exceeding_who: {
    en: 'Annual count of days where PM2.5 exceeds the WHO daily guideline of 15 µg/m³ (2021 update). High counts indicate chronic air-quality concern beyond brief seasonal spikes.',
    th: 'จำนวนวันที่ค่า PM2.5 เกินค่าแนะนำขององค์การอนามัยโลก ต่อปี ค่าต่ำดีกว่า',
  },
  ind_population_density: {
    en: 'Provincial population density in persons per square kilometre, from Department of Provincial Administration data. Scored on a parabolic curve: very low and very high density both reduce liveability (under-served rural at one end, over-crowded urban at the other); mid-density optimum.',
    th: 'ความหนาแน่นประชากรจังหวัด (คน/ตร.กม.) ใช้เกณฑ์โค้งพาราโบลา จุดเหมาะสมที่ความหนาแน่นปานกลาง',
  },
  ind_public_transport_access: {
    en: 'Public transport access proxy — count of transit nodes (bus stops, BTS/MRT stations, rail stops) within a 30 km radius of the provincial centroid, from OpenStreetMap. Higher density reduces car-dependence.',
    th: 'การเข้าถึงระบบขนส่งสาธารณะ (พร็อกซี Overpass) ค่าสูงดีกว่า',
  },
  ind_rail_access: {
    en: 'Provincial rail-network access score, derived from State Railway of Thailand and metro/sky-train station presence. Higher access supports inter-provincial mobility and tourism.',
    th: 'การเข้าถึงทางรถไฟของจังหวัด ค่าสูงดีกว่า',
  },
  ind_rainfall_days_per_year: {
    en: 'Annual count of wet days (≥1 mm precipitation) from NASA POWER bias-corrected reanalysis. Scored on a parabolic curve: too few days suggests drought stress; too many disrupts outdoor activity and increases flood risk; mid-range optimum.',
    th: 'จำนวนวันที่มีฝนตก (≥1 มม.) ต่อปี ใช้เกณฑ์โค้งพาราโบลา จุดเหมาะสมที่ค่ากลาง',
  },
  ind_rpsto_per_10k_total: {
    en: "Sub-district health-promotion hospitals (โรงพยาบาลส่งเสริมสุขภาพตำบล / รพ.สต.) per 10,000 residents — Thailand's primary-care frontline in rural sub-districts. Higher density indicates better last-mile access to basic healthcare.",
    th: 'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) ต่อประชากร 10,000 คน ค่าสูงดีกว่า',
  },
  ind_tat_events_per_100k: {
    en: 'Tourism Authority of Thailand registered tourism and cultural events per 100,000 residents per year. A higher event density indicates active cultural calendar (festivals, fairs, traditional ceremonies) that contributes to community life and tourism economy.',
    th: 'จำนวนงานท่องเที่ยวและวัฒนธรรมที่ขึ้นทะเบียนกับ ททท. ต่อประชากร 100,000 คน ต่อปี ค่าสูงดีกว่า',
  },
  ind_tree_canopy_pct: {
    en: 'Percentage of provincial land area covered by tree canopy, from Hansen Global Forest Change v1.12 satellite data (University of Maryland GLAD lab). Tree canopy supports cooling, air filtration, biodiversity, and storm-water management.',
    th: 'สัดส่วนพื้นที่ที่มีเรือนยอดต้นไม้ปกคลุมจังหวัด ค่าสูงดีกว่า',
  },
  ind_unesco_whs_count: {
    en: 'Number of UNESCO World Heritage sites inscribed within the province. Display-only — not part of the composite score; UNESCO inscription is a narrow signal that misses provinces with strong national heritage but no UNESCO listing (Bangkok, Chiang Mai). Methodology v1.2 replaces with the FAD national heritage registry.',
    th: 'จำนวนแหล่งมรดกโลก UNESCO ในจังหวัด แสดงเพื่อความครบถ้วน ไม่นำไปคำนวณคะแนนรวม',
  },
  ind_walkability_score: {
    en: "Composite walkability score derived from OpenStreetMap pedestrian-network density and street-grid connectivity around the province's urban centroid. Higher walkability supports daily activity, retail clustering, and reduces car-dependence.",
    th: 'คะแนนความสามารถในการเดินเท้า ค่าสูงดีกว่า',
  },
  ind_waste_management_score: {
    en: 'Provincial solid-waste management performance — share of waste properly collected and processed, from Pollution Control Department data. Higher values reduce open dumping, water-pollution risk, and disease vectors.',
    th: 'ประสิทธิภาพการจัดการขยะของจังหวัด ค่าสูงดีกว่า',
  },
};

export function indicatorDescription(id: string, locale: Locale): string {
  const desc = INDICATOR_PLAIN_DESCRIPTIONS[id];
  if (!desc) return '';
  return locale === 'th' ? desc.th : desc.en;
}
