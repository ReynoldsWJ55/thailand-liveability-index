// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Editorial registry — which provinces have a Layer 2 editorial piece.
 *
 * A small, hand-maintained map from province slug → editorial metadata.
 * The province page reads this and surfaces a banner above the category
 * breakdown when an entry exists. Add a new editorial here when its page
 * goes live; the cross-link surfaces automatically on the province page.
 *
 * Editorials live at /<locale>/editorial/<slug>/ — the slug is the same
 * string the province page uses. (For Yasothon, both are 'yasothon'.)
 */
export interface EditorialMeta {
  /** Routing slug — also the province slug for now. Could diverge later. */
  slug: string;
  title_en: string;
  title_th: string;
  /** ISO 8601 date — when the editorial was published / field trip end date. */
  date: string;
  /** Display byline. Single name or 'By X and Y'. */
  byline: string;
  /** Shown beneath the title in the banner — typed sub-eyebrow. EN only for now. */
  kicker_en: string;
  kicker_th: string;
}

export const EDITORIALS: Record<string, EditorialMeta> = {
  yasothon: {
    slug: 'yasothon',
    title_en: 'Yasothon, on the data and in person',
    title_th: 'ยโสธร เมื่อมองจากข้อมูลและจากการลงพื้นที่',
    date: '2026-05-10',
    byline: 'Will Reynolds',
    kicker_en: 'Field notes from 8–10 May 2026',
    kicker_th: 'บันทึกภาคสนาม 8–10 พฤษภาคม 2026',
  },
};

export function getEditorial(provinceSlug: string): EditorialMeta | undefined {
  return EDITORIALS[provinceSlug];
}
