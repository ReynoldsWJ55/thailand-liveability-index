// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * In-development indicators — frontend-only stubs.
 *
 * These four indicators are scoped, source-onboarded, and locked into the v1.2
 * indicator-spike (June 2026), but not yet wired into the live composite. They
 * exist on the frontend so:
 *
 *   1. The roadmap is concrete — each has its own URL, JSON-LD Dataset schema,
 *      and "data not yet available" page that AI search engines can index now.
 *   2. The hub-and-spoke link graph stays consistent — siblings in the same
 *      category list them today and the link doesn't 404 once they go live.
 *   3. SEO accumulates against the eventual canonical URL before launch.
 *
 * Data shape mirrors `indicator-meta.json` so the renderer can treat them
 * uniformly. They carry an extra `status` flag so pages can render the right
 * "in development" UI and we never accidentally fold them into the composite.
 *
 * When v1.2 wires one of these in:
 *   - Move it out of this file
 *   - Add it to `indicator-meta.json` (and to the data pipeline)
 *   - Add to SLUG_MAP, INDICATOR_DISPLAY_ORDER, INDICATOR_DIRECTION,
 *     INDICATOR_PLAIN_DESCRIPTIONS in lookups.ts
 *   - Bump the indicator count and the v-spike-completion note in 99-meta.
 */
import type { CategoryId } from './types';
import type { IndicatorDirection } from './lookups';

export interface InDevelopmentIndicator {
  id: string;
  slug: string;
  label_en: string;
  label_th: string;
  unit: string;
  source: string;
  source_url: string;
  source_description: string;
  category: CategoryId;
  weight: number;
  direction: IndicatorDirection;
  /** Plain-language summary for the "What this measures" section. */
  description_en: string;
  description_th: string;
  /** Why it's not live yet — surfaced on the page. */
  status_note_en: string;
  status_note_th: string;
  /** Target methodology version that wires this in. */
  target_version: string;
  /** Target completion month/year. */
  target_eta: string;
}

export const IN_DEVELOPMENT_INDICATORS: InDevelopmentIndicator[] = [
  {
    id: 'ind_cycling_infrastructure_per_capita',
    slug: 'cycling-infrastructure',
    label_en: 'Cycling Infrastructure Per Capita',
    label_th: 'โครงสร้างพื้นฐานจักรยานต่อหัว',
    unit: 'km / 100k residents',
    source: 'OpenStreetMap (Overpass API)',
    source_url: 'https://www.openstreetmap.org/about',
    source_description: 'Length of dedicated cycle network derived from OSM tags highway=cycleway and cycleway=track, normalised by provincial population.',
    category: 'connectivity',
    weight: 0.5,
    direction: 'higher',
    description_en: 'Length of dedicated cycle network per 100,000 residents, derived from OpenStreetMap road and cycleway tags. Higher density supports active mobility, reduces car-dependence, and signals provincial investment in non-motorised transport.',
    description_th: 'ความยาวเส้นทางจักรยานเฉพาะต่อประชากร 100,000 คน คำนวณจาก OpenStreetMap ค่าสูงดีกว่า ส่งเสริมการเดินทางด้วยพลังงานสะอาดและลดการพึ่งพารถยนต์',
    status_note_en: 'Source-onboarded; pipeline transform queued. Goalpost calibration depends on a Thailand-specific lower bound (cycle infrastructure is sparse outside Bangkok metro and a handful of tourist provinces) — being set against OECD-comparable provincial benchmarks rather than a percentile ramp.',
    status_note_th: 'ตรวจสอบแหล่งข้อมูลแล้ว รอการประสานข้อมูล กำลังตั้งเกณฑ์มาตรฐานเทียบกับเกณฑ์ระดับจังหวัดของ OECD ไม่ใช่เปอร์เซ็นไทล์',
    target_version: 'v1.2',
    target_eta: 'June 2026',
  },
  {
    id: 'ind_specialist_physician_density',
    slug: 'specialist-physician-density',
    label_en: 'Specialist Physician Density',
    label_th: 'ความหนาแน่นแพทย์เฉพาะทาง',
    unit: 'specialists / 100k',
    source: 'Ministry of Public Health — HRH Center',
    source_url: 'https://hrops.moph.go.th/',
    source_description: 'Specialist physicians per 100,000 residents, sourced from the Ministry of Public Health Human Resources for Health Center registry.',
    category: 'healthcare',
    weight: 0.5,
    direction: 'higher',
    description_en: 'Specialist physicians per 100,000 residents — pairs with the headline hospital-bed-density indicator to surface the gap between facility presence and clinical capacity. A province with many beds but few specialists is fragile to demand surges.',
    description_th: 'แพทย์เฉพาะทางต่อประชากร 100,000 คน คู่กับความหนาแน่นเตียงโรงพยาบาล แสดงความต่างระหว่างความพร้อมของสถานพยาบาลกับขีดความสามารถทางคลินิก',
    status_note_en: 'Registry data is provincial but specialty-stratified at a level that needs harmonisation across MoPH, private-sector, and Faculty-of-Medicine registries. Aggregation logic locked but final pull awaits a 2026 H1 refresh from the HRH Center.',
    status_note_th: 'ข้อมูลทะเบียนเป็นรายจังหวัดแต่จำแนกตามสาขาในระดับที่ต้องประสานข้อมูลระหว่างหน่วยงาน รอการอัปเดตจากศูนย์ HRH ในครึ่งแรกของปี 2026',
    target_version: 'v1.2',
    target_eta: 'June 2026',
  },
  {
    id: 'ind_power_reliability_saidi',
    slug: 'electric-power-reliability',
    label_en: 'Electric Power Reliability (SAIDI)',
    label_th: 'ความน่าเชื่อถือของไฟฟ้า (SAIDI)',
    unit: 'minutes lost / customer / year',
    source: 'MEA + PEA annual reports',
    source_url: 'https://www.pea.co.th/',
    source_description: 'System Average Interruption Duration Index (SAIDI) — total outage minutes per customer per year, published by Metropolitan Electricity Authority (Bangkok metro) and Provincial Electricity Authority (the other 75 provinces).',
    category: 'connectivity',
    weight: 0.5,
    direction: 'lower',
    description_en: 'Total electricity outage minutes per customer per year. Lower is better. Captures grid resilience, which matters for residents, remote workers, and small businesses; particularly relevant in storm-exposed and grid-edge provinces.',
    description_th: 'นาทีไฟฟ้าดับต่อผู้ใช้ต่อปี ค่าต่ำดีกว่า สะท้อนความทนทานของระบบไฟฟ้า สำคัญต่อประชาชน ผู้ทำงานทางไกล และธุรกิจขนาดเล็ก',
    status_note_en: 'Two-region harmonisation pending: MEA covers Bangkok + Nonthaburi + Samut Prakan; PEA covers the remaining 75 provinces. Reporting cadence and outage-classification differ slightly. Target alignment: PEA quarterly report Q3 2026.',
    status_note_th: 'รอการประสานข้อมูลสองพื้นที่: MEA ครอบคลุมกรุงเทพ นนทบุรี สมุทรปราการ ส่วน PEA ครอบคลุมอีก 75 จังหวัด รอบการรายงานและการจำแนกประเภทเหตุการณ์ต่างกันเล็กน้อย เป้าหมายประสาน Q3 2026',
    target_version: 'v1.2',
    target_eta: 'June 2026',
  },
  {
    id: 'ind_fad_heritage_sites_count',
    slug: 'fad-heritage-sites',
    label_en: 'Fine Arts Department Registered Heritage Sites',
    label_th: 'แหล่งมรดกที่ขึ้นทะเบียนกรมศิลปากร',
    unit: 'sites',
    source: 'Fine Arts Department (FAD), Ministry of Culture',
    source_url: 'https://www.finearts.go.th/',
    source_description: 'Count of nationally-registered heritage sites within each province, from the Fine Arts Department registry. Replaces the display-only UNESCO World Heritage indicator at weight 0.5 per methodology decision DM-20260502.',
    category: 'culture',
    weight: 0.5,
    direction: 'higher',
    description_en: 'Number of heritage sites within the province registered with the Fine Arts Department — Thailand\'s national heritage register. Captures the cultural depth UNESCO listing misses: provinces with strong national heritage but no UNESCO listing (e.g. Bangkok, Chiang Mai for some sites) score appropriately.',
    description_th: 'จำนวนแหล่งมรดกในจังหวัดที่ขึ้นทะเบียนกับกรมศิลปากร ทะเบียนระดับชาติของไทย ครอบคลุมความลึกทางวัฒนธรรมที่รายชื่อ UNESCO ไม่รวม',
    status_note_en: 'Replaces the legacy UNESCO indicator (decision DM-20260502, 2026-05-02). Registry is published; the wiring step is mapping registry entries to the current 77-province administrative boundaries (some entries pre-date 2011 boundary changes).',
    status_note_th: 'แทนตัวชี้วัด UNESCO เดิม (การตัดสินใจ DM-20260502 วันที่ 2026-05-02) ทะเบียนเปิดเผยแล้ว เหลือขั้นตอนผูกข้อมูลกับขอบเขต 77 จังหวัดปัจจุบัน',
    target_version: 'v1.2',
    target_eta: 'June 2026',
  },
];

export function inDevelopmentBySlug(slug: string): InDevelopmentIndicator | undefined {
  return IN_DEVELOPMENT_INDICATORS.find((x) => x.slug === slug);
}

export function inDevelopmentByCategory(category: CategoryId): InDevelopmentIndicator[] {
  return IN_DEVELOPMENT_INDICATORS.filter((x) => x.category === category);
}
