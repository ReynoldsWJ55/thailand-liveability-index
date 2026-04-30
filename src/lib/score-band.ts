/**
 * Score-band logic. Bands are inclusive at the lower edge:
 *   0:  0–19  POOR    .score-0  (brick)
 *   1: 20–39  WEAK    .score-1  (terracotta)
 *   2: 40–59  MIXED   .score-2  (amber)
 *   3: 60–79  GOOD    .score-3  (sage)
 *   4: 80–100 STRONG  .score-4  (deep green)
 *
 * Floored provinces render visually as band 0 (with hatch + "FLOORED" label).
 * Use `bandClass(score)` for the CSS class and `bandLabel(score)` for the
 * uppercase text. Pass the floored flag separately to surface the FLOORED
 * label instead of the band label.
 */
import type { Locale } from '../data/types';

export type ScoreBand = 0 | 1 | 2 | 3 | 4;

const BAND_LABELS_EN = ['POOR', 'WEAK', 'MIXED', 'GOOD', 'STRONG'] as const;
const BAND_LABELS_TH = ['ต่ำ', 'อ่อน', 'ปานกลาง', 'ดี', 'แข็งแกร่ง'] as const;

export function scoreBand(score: number): ScoreBand {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 80) return 3;
  return 4;
}

export function bandClass(score: number | null, floored = false): string {
  if (floored || score === null) return 'score-0';
  return `score-${scoreBand(score)}`;
}

export function bandLabel(
  score: number | null,
  floored = false,
  locale: Locale = 'en',
): string {
  if (floored) return locale === 'th' ? 'ติดเพดาน' : 'FLOORED';
  if (score === null) return locale === 'th' ? 'ไม่มีข้อมูล' : 'NO DATA';
  const labels = locale === 'th' ? BAND_LABELS_TH : BAND_LABELS_EN;
  return labels[scoreBand(score)];
}
