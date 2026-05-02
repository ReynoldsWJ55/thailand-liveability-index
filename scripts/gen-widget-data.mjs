#!/usr/bin/env node
// Copyright (c) 2026 Will Reynolds
// SPDX-License-Identifier: MIT
/**
 * Emit per-province widget-data JSON files at build time.
 *
 *   public/api/v1/widget-data/index.json     — list of {id, name_en, name_th}
 *   public/api/v1/widget-data/<id>.json      — full record for one province
 *
 * The real <tli-widget> Web Component fetches these. They're the v1 schema
 * the eventual production API will also serve — keeping the static and
 * dynamic surfaces shape-identical.
 *
 * Schema:
 *   {
 *     "id": "phuket",
 *     "name": { "en": "Phuket", "th": "ภูเก็ต" },
 *     "region": { "en": "Southern Thailand", "th": "ภาคใต้" },
 *     "composite": 58,
 *     "band": 2,
 *     "band_label": "MIXED",
 *     "floored": false,
 *     "rank": 24,
 *     "as_of": "2025-12-31",
 *     "categories": [
 *       { "id": "climate", "label_en": "Environment & Climate", "score": 42, "band": 2 },
 *       …7 entries in canonical order
 *     ],
 *     "top3": [ { "id": "economy", "label_en": "Cost & Economy", "icon": "trending-up", "score": 72, "band": 3 }, … ],
 *     "license": "https://creativecommons.org/licenses/by-nc/4.0/",
 *     "methodology_version": "v1.0",
 *     "ingestion_version": "ymd-…",
 *     "deeplink": { "en": "/en/phuket/", "th": "/th/phuket/" }
 *   }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const scoresPath = path.join(root, 'src/data/scores.json');
if (!fs.existsSync(scoresPath)) {
  console.error('gen-widget-data: src/data/scores.json missing — run `npm run fetch-scores` first');
  process.exit(1);
}
const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));

// Canonical category order + EN/TH labels + icon tokens. Kept in lockstep
// with src/data/lookups.ts CATEGORIES.
const CATS = [
  { id: 'climate',      icon: 'cloud-sun',   en: 'Environment & Climate',   th: 'สิ่งแวดล้อมและภูมิอากาศ',     short_en: 'Climate', short_th: 'อากาศ' },
  { id: 'healthcare',   icon: 'cross',       en: 'Healthcare',              th: 'การดูแลสุขภาพ',                short_en: 'Health',  short_th: 'สุขภาพ' },
  { id: 'connectivity', icon: 'route',       en: 'Connectivity & Transport', th: 'การคมนาคมและการเชื่อมต่อ',   short_en: 'Transit', short_th: 'คมนาคม' },
  { id: 'economy',      icon: 'trending-up', en: 'Cost & Economy',          th: 'ค่าครองชีพและเศรษฐกิจ',         short_en: 'Economy', short_th: 'ศก.' },
  { id: 'safety',       icon: 'shield',      en: 'Safety & Governance',     th: 'ความปลอดภัยและธรรมาภิบาล',    short_en: 'Safety',  short_th: 'ปลอดภัย' },
  { id: 'culture',      icon: 'users-round', en: 'Lifestyle & Culture',     th: 'วิถีชีวิตและวัฒนธรรม',         short_en: 'Culture', short_th: 'วัฒน.' },
  { id: 'demographics', icon: 'users',       en: 'Demographics & Scale',    th: 'ประชากรและขนาดเมือง',          short_en: 'People',  short_th: 'ปชก.' },
];
const REGION_TH = {
  'Bangkok and Vicinities': 'กรุงเทพและปริมณฑล',
  Central:      'ภาคกลาง',
  Eastern:      'ภาคตะวันออก',
  Western:      'ภาคตะวันตก',
  Northern:     'ภาคเหนือ',
  Northeastern: 'ภาคตะวันออกเฉียงเหนือ',
  Southern:     'ภาคใต้',
};
const REGION_EN_SHORT = {
  'Bangkok and Vicinities': 'Greater Bangkok',
  Central:      'Central Thailand',
  Eastern:      'Eastern Thailand',
  Western:      'Western Thailand',
  Northern:     'Northern Thailand',
  Northeastern: 'Northeastern Thailand',
  Southern:     'Southern Thailand',
};

function bandFor(score, floored) {
  if (floored) return 0;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}
const BAND_LABELS = ['POOR', 'WEAK', 'MIXED', 'GOOD', 'STRONG'];

function recordFor(p) {
  const composite = p.floored ? 0 : Math.round(p.composite ?? 0);
  const band = bandFor(composite, p.floored);
  const cats = CATS.map((c) => {
    const s = Math.round(p.categories?.[c.id]?.score ?? 0);
    return {
      id: c.id,
      icon: c.icon,
      label_en: c.en,
      label_th: c.th,
      short_en: c.short_en,
      short_th: c.short_th,
      score: s,
      band: bandFor(s, false),
    };
  });
  const asOf = CATS
    .map((c) => p.categories?.[c.id]?.freshest_as_of)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? '';
  const top3 = [...cats].sort((a, b) => b.score - a.score).slice(0, 3);
  return {
    id: p.id,
    name: { en: p.name_en, th: p.name_th },
    region: {
      en: REGION_EN_SHORT[p.region] ?? p.region,
      th: REGION_TH[p.region] ?? p.region,
    },
    composite,
    band,
    band_label: BAND_LABELS[band],
    floored: !!p.floored,
    rank: p.rank ?? 0,
    as_of: asOf,
    categories: cats,
    top3,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    attribution_required: 'Thailand Liveability Index, 2026 (CC BY-NC 4.0)',
    methodology_version: scores.methodology_version,
    ingestion_version: scores.ingestion_version,
    deeplink: { en: `/en/${p.id}/`, th: `/th/${p.id}/` },
  };
}

const outDir = path.join(root, 'public/api/v1/widget-data');
fs.mkdirSync(outDir, { recursive: true });

const index = scores.provinces.map((p) => ({
  id: p.id,
  name: { en: p.name_en, th: p.name_th },
}));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
let count = 1;
for (const p of scores.provinces) {
  const rec = recordFor(p);
  fs.writeFileSync(path.join(outDir, `${rec.id}.json`), JSON.stringify(rec));
  count++;
}
console.log(`gen-widget-data: wrote ${count} files to public/api/v1/widget-data/`);
