// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Applicability overrides — pre-v1.2 tactical N/A treatment.
 *
 * Some indicators don't fit certain province types and produce score-0 as
 * artifact, not signal (e.g. RPSTO sub-district health-promotion hospitals
 * for Bangkok, which has no rural sub-districts). The proper methodology
 * fix is queued for v1.2 (per `00-decisions/methodology-v1.2-smell-test-queue.md`
 * §A and `dm-20260502-fad-replaces-unesco-as-scored-heritage-indicator.md` §4).
 *
 * This file is the *display-only* tactical fix that ships pre-v1.2: indicators
 * listed here render with a gray "N/A" pill instead of a score, with a
 * per-indicator tooltip rationale. The underlying value still appears in the
 * Value column. Category scores are NOT recomputed by this file — the v1.2
 * methodology change does that work natively.
 *
 * Province IDs and indicator IDs match the slugs in scores.json /
 * indicator-meta.json. Each entry carries its own EN+TH rationale so the
 * tooltip is specific (per Will's tooltip-clarity directive — generic
 * "doesn't apply" was insufficient).
 *
 * To add a new override: append an entry. To remove (when v1.2 lands): drop
 * the entry; the indicator reverts to native scoring.
 */

export interface ApplicabilityOverride {
  /** Province id matching scores.json `province.id`. */
  provinceId: string;
  /** Indicator id matching `indicator-meta.json` keys (`ind_*` form). */
  indicatorId: string;
  /** Tooltip rationale, English. One sentence; specific not generic. */
  rationale_en: string;
  /** Tooltip rationale, Thai. */
  rationale_th: string;
}

export const APPLICABILITY_OVERRIDES: ApplicabilityOverride[] = [
  {
    provinceId: 'bangkok',
    indicatorId: 'ind_rpsto_per_10k_total',
    rationale_en:
      'Sub-district health-promotion hospitals (รพ.สต.) operate in rural sub-districts. Bangkok\'s administrative structure has no equivalent — the healthcare score reflects beds, hospital-grade facilities, and JCI accreditation instead.',
    rationale_th:
      'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) ดำเนินงานในตำบลชนบท โครงสร้างการบริหารของกรุงเทพฯ ไม่มีหน่วยงานเทียบเท่า คะแนนหมวดสาธารณสุขสะท้อนเตียงโรงพยาบาล สถานพยาบาลระดับโรงพยาบาล และการรับรอง JCI แทน',
  },
  {
    provinceId: 'bangkok',
    indicatorId: 'ind_forest_cover_pct',
    rationale_en:
      'Provincial forest cover measures forested area. Bangkok is a fully-urbanized special administrative district where this indicator structurally yields near-zero — the category score is computed from the other Environment & Climate indicators.',
    rationale_th:
      'สัดส่วนพื้นที่ป่าของจังหวัดวัดพื้นที่ป่า กรุงเทพฯ เป็นเขตการปกครองพิเศษที่เป็นเมืองอย่างสมบูรณ์ ตัวชี้วัดนี้จะให้ค่าใกล้ศูนย์โดยโครงสร้าง คะแนนหมวดคำนวณจากตัวชี้วัดสิ่งแวดล้อมและภูมิอากาศอื่นๆ',
  },
  {
    provinceId: 'bangkok',
    indicatorId: 'ind_tree_canopy_pct',
    rationale_en:
      'Tree canopy coverage measures forested area from satellite imagery. Bangkok\'s 3% canopy is artifact of being a fully-urbanized province, not a real environmental gap — the category score is computed from the other Environment & Climate indicators.',
    rationale_th:
      'สัดส่วนเรือนยอดของต้นไม้วัดพื้นที่ป่าจากภาพถ่ายดาวเทียม สัดส่วนเรือนยอด 3% ของกรุงเทพฯ เป็นผลจากการเป็นจังหวัดที่เป็นเมืองอย่างสมบูรณ์ ไม่ใช่ช่องว่างด้านสิ่งแวดล้อมจริง คะแนนหมวดคำนวณจากตัวชี้วัดอื่นๆ',
  },
  {
    provinceId: 'bangkok',
    indicatorId: 'ind_unesco_whs_count',
    rationale_en:
      'UNESCO World Heritage inscriptions cover only 16 of Thailand\'s 77 provinces. Bangkok hosts ~200 nationally-registered ancient monuments (Wat Pho, Wat Arun, Grand Palace, others) but no UNESCO inscription. We measure cultural heritage breadth via the FAD national registry instead (lands in methodology v1.2).',
    rationale_th:
      'การขึ้นทะเบียนมรดกโลก UNESCO ครอบคลุมเพียง 16 จาก 77 จังหวัดของไทย กรุงเทพฯ มีโบราณสถานที่ขึ้นทะเบียนระดับชาติประมาณ 200 แห่ง (วัดโพธิ์ วัดอรุณ พระบรมมหาราชวัง และอื่นๆ) แต่ไม่มีรายการมรดกโลก เราจะวัดความหลากหลายของมรดกวัฒนธรรมผ่านทะเบียนกรมศิลปากรแทน (ในระเบียบวิธี v1.2)',
  },
];

/**
 * Lookup helper: is this (province, indicator) pair overridden? Returns the
 * rationale entry or undefined.
 */
export function getApplicabilityOverride(
  provinceId: string,
  indicatorId: string,
): ApplicabilityOverride | undefined {
  return APPLICABILITY_OVERRIDES.find(
    (o) => o.provinceId === provinceId && o.indicatorId === indicatorId,
  );
}

/**
 * Lookup helper: which indicators are overridden for this province? Used by
 * the methodology-honest note above the affected categories.
 */
export function getOverriddenIndicatorIds(provinceId: string): string[] {
  return APPLICABILITY_OVERRIDES.filter((o) => o.provinceId === provinceId).map(
    (o) => o.indicatorId,
  );
}
