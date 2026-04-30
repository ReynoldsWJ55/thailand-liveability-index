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
  cost: {
    id: 'cost',
    label_en: 'Cost of Living',
    label_th: 'ค่าครองชีพ',
    icon: 'wallet',
    cssClass: 'cat-cost',
  },
  safety: {
    id: 'safety',
    label_en: 'Safety & Security',
    label_th: 'ความปลอดภัย',
    icon: 'shield',
    cssClass: 'cat-safety',
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
    label_th: 'การคมนาคม',
    icon: 'route',
    cssClass: 'cat-connectivity',
  },
  culture: {
    id: 'culture',
    label_en: 'Culture & Community',
    label_th: 'วัฒนธรรมและชุมชน',
    icon: 'users-round',
    cssClass: 'cat-culture',
  },
  economy: {
    id: 'economy',
    label_en: 'Economy & Opportunity',
    label_th: 'เศรษฐกิจและโอกาส',
    icon: 'trending-up',
    cssClass: 'cat-economy',
  },
};

/** Canonical render order across the site. */
export const CATEGORY_ORDER: CategoryId[] = [
  'climate',
  'cost',
  'safety',
  'healthcare',
  'connectivity',
  'culture',
  'economy',
];

export function categoryLabel(id: CategoryId, locale: Locale): string {
  return locale === 'th' ? CATEGORIES[id].label_th : CATEGORIES[id].label_en;
}

const REGION_LABELS_TH: Record<Region, string> = {
  North: 'ภาคเหนือ',
  Northeast: 'ภาคตะวันออกเฉียงเหนือ',
  Central: 'ภาคกลาง',
  East: 'ภาคตะวันออก',
  South: 'ภาคใต้',
};

export function regionLabel(region: Region, locale: Locale): string {
  return locale === 'th' ? REGION_LABELS_TH[region] : `${region} Thailand`;
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
  },
};
