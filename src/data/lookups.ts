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
    label_en: 'Climate & Environment',
    label_th: 'ภูมิอากาศและสิ่งแวดล้อม',
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

/**
 * Canonical URL for the public TLI source repository. Surfaced in the
 * province-page CTA panel and (eventually) other "view source" affordances.
 * The private working repo is intentionally NOT exposed.
 */
export const TLI_GITHUB_URL = 'https://github.com/ReynoldsWJ55/thailand-liveability-index';

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
  // Province-page bottom CTA panel
  /** "Read how Bangkok's score is computed" — provinceName interpolated. */
  ctaPanelTitle: (provinceName: string) => string;
  /** "Methodology v1.0 · 7 sections · 22 indicators · all sources cited." */
  ctaPanelSub: string;
  ctaMethodologyButton: string;
  ctaSourceButton: string;
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
    ctaPanelTitle: (name) => `Read how ${name}'s score is computed`,
    ctaPanelSub: 'Methodology v1.0 · 7 categories · 22 indicators · every source cited.',
    ctaMethodologyButton: 'Methodology',
    ctaSourceButton: 'Source on GitHub',
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
    ctaPanelTitle: (name) => `วิธีคำนวณคะแนนของ${name}`,
    ctaPanelSub: 'ระเบียบวิธี v1.0 · 7 หมวด · 22 ตัวชี้วัด · อ้างอิงแหล่งที่มาครบทุกตัว',
    ctaMethodologyButton: 'ระเบียบวิธี',
    ctaSourceButton: 'ซอร์สโค้ดบน GitHub',
  },
};
