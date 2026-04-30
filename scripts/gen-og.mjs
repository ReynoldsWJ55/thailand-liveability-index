#!/usr/bin/env node
/**
 * Generate OG (Open Graph) images at build time.
 *
 * Reads src/data/scores.json, emits one 1200×630 PNG per page into
 * public/og/. Each page references its own OG image via the Site layout's
 * ogImage prop.
 *
 *   /en/                    -> public/og/home.png
 *   /en/<province>/         -> public/og/<province>.png  (per province)
 *   /en/methodology/        -> public/og/methodology.png
 *   /en/about/              -> public/og/about.png
 *   default fallback        -> public/og/default.png   (copy of home)
 *
 * SVG generation is hand-rolled; PNG conversion is via @resvg/resvg-js.
 * Fonts: only IBM Plex Sans (already vendored at public/fonts/).
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const W = 1200;
const H = 630;

// Design system tokens — keep in sync with colors_and_type.css if those change.
const PAPER = '#FAF7F2';
const PAPER_2 = '#F2EEE6';
const INK = '#1A1A1A';
const INK_2 = '#555';
const INK_3 = '#888';
const BRAND = '#1F5F6B';
const RULE = '#E2DFD8';
const SCORE_COLORS = ['#B0413E', '#D88555', '#D9A441', '#7BA481', '#2E7D5B'];
const BAND_LABELS = ['POOR', 'WEAK', 'MIXED', 'GOOD', 'STRONG'];

const FONT_FILES = [
  path.join(root, 'public/fonts/IBMPlexSans-Regular.ttf'),
  path.join(root, 'public/fonts/IBMPlexSans-Medium.ttf'),
  path.join(root, 'public/fonts/IBMPlexSans-SemiBold.ttf'),
  path.join(root, 'public/fonts/IBMPlexSans-Bold.ttf'),
  path.join(root, 'public/fonts/IBMPlexSans-Italic.ttf'),
  path.join(root, 'public/fonts/IBMPlexSansThai-Regular.ttf'),
  path.join(root, 'public/fonts/IBMPlexSansThai-SemiBold.ttf'),
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function bandFor(score, floored) {
  if (floored) return 0;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

// Common header — brand wordmark, top hairline.
function header() {
  return `
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="${PAPER}" stroke="${RULE}" stroke-width="1.5"/>
    <text x="80" y="120" font-family="IBM Plex Sans" font-size="32" font-weight="700" fill="${INK}" letter-spacing="-0.5">
      <tspan>TLI</tspan><tspan fill="${BRAND}">.</tspan>
      <tspan font-weight="400" fill="${INK_3}" font-size="22" dx="14">Thailand Liveability Index</tspan>
    </text>
  `;
}

function footer(left, right) {
  return `
    <line x1="80" y1="${H - 130}" x2="${W - 80}" y2="${H - 130}" stroke="${RULE}" stroke-width="1"/>
    <text x="80" y="${H - 80}" font-family="IBM Plex Sans" font-size="20" font-weight="500" fill="${INK_3}" letter-spacing="2">${escapeXml(left.toUpperCase())}</text>
    <text x="${W - 80}" y="${H - 80}" text-anchor="end" font-family="IBM Plex Sans" font-size="20" font-weight="500" fill="${INK_3}" letter-spacing="2">${escapeXml(right.toUpperCase())}</text>
  `;
}

function bandRamp(x, y, w, h) {
  const cellW = w / 5;
  const gap = 2;
  return SCORE_COLORS.map((c, i) =>
    `<rect x="${x + i * cellW}" y="${y}" width="${cellW - gap}" height="${h}" fill="${c}" rx="2"/>`,
  ).join('');
}

function homeSvg() {
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${header()}
    <text x="80" y="280" font-family="IBM Plex Sans" font-size="74" font-weight="600" fill="${INK}" letter-spacing="-2">
      77 Thai provinces,
    </text>
    <text x="80" y="370" font-family="IBM Plex Sans" font-size="74" font-weight="600" fill="${INK}" letter-spacing="-2">
      <tspan fill="${BRAND}" font-style="italic">scored</tspan> on the data.
    </text>
    <text x="80" y="430" font-family="IBM Plex Sans" font-size="28" font-weight="400" fill="${INK_2}">Seven categories. Geometric mean. Honest provenance.</text>
    ${bandRamp(80, 470, 800, 14)}
    <text x="80" y="510" font-family="IBM Plex Sans" font-size="16" font-weight="500" fill="${INK_3}" letter-spacing="2">POOR · WEAK · MIXED · GOOD · STRONG</text>
    ${footer('thailandliveabilityindex.com', 'AS OF MAR 2026')}
  </svg>`;
}

function provinceSvg(p) {
  const score = p.floored ? 0 : (p.composite ?? 0);
  const band = bandFor(score, p.floored);
  const color = SCORE_COLORS[band];
  const subtitle = p.floored
    ? 'Floored at 0 — see methodology'
    : `Rank ${p.rank} of 77`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${header()}
    <text x="80" y="200" font-family="IBM Plex Sans" font-size="20" font-weight="500" fill="${INK_3}" letter-spacing="2">PROVINCE · ${escapeXml(p.region.toUpperCase())}</text>
    <text x="80" y="290" font-family="IBM Plex Sans" font-size="64" font-weight="600" fill="${INK}" letter-spacing="-1">${escapeXml(p.name_en)}</text>
    <text x="80" y="335" font-family="IBM Plex Sans" font-size="26" font-weight="400" fill="${INK_2}" font-style="italic">${escapeXml(p.name_th)}</text>

    <text x="80" y="500" font-family="IBM Plex Sans" font-size="200" font-weight="500" fill="${color}" letter-spacing="-6">${score}</text>
    <text x="430" y="430" font-family="IBM Plex Sans" font-size="22" font-weight="500" fill="${INK_3}" letter-spacing="2">/ 100</text>
    <text x="430" y="480" font-family="IBM Plex Sans" font-size="32" font-weight="600" fill="${color}" letter-spacing="2">${BAND_LABELS[band]}</text>
    <text x="430" y="510" font-family="IBM Plex Sans" font-size="20" font-weight="400" fill="${INK_2}">${escapeXml(subtitle)}</text>

    ${footer(`thailandliveabilityindex.com / ${p.id}`, 'AS OF MAR 2026')}
  </svg>`;
}

function methodologySvg() {
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${header()}
    <text x="80" y="200" font-family="IBM Plex Sans" font-size="20" font-weight="500" fill="${INK_3}" letter-spacing="2">METHODOLOGY · v1.0</text>
    <text x="80" y="300" font-family="IBM Plex Sans" font-size="74" font-weight="600" fill="${INK}" letter-spacing="-2">How TLI is built</text>
    <text x="80" y="380" font-family="IBM Plex Sans" font-size="28" font-weight="400" fill="${INK_2}">Seven categories. Geometric mean.</text>
    <text x="80" y="420" font-family="IBM Plex Sans" font-size="28" font-weight="400" fill="${INK_2}"><tspan fill="${BRAND}" font-style="italic">Non-substitutable</tspan> by design — a 0 in any category</text>
    <text x="80" y="460" font-family="IBM Plex Sans" font-size="28" font-weight="400" fill="${INK_2}">floors the composite at 0.</text>
    ${footer('thailandliveabilityindex.com / methodology', 'CC BY 4.0')}
  </svg>`;
}

function aboutSvg(provinceCount, sourceCount, indicatorCount) {
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${header()}
    <text x="80" y="200" font-family="IBM Plex Sans" font-size="20" font-weight="500" fill="${INK_3}" letter-spacing="2">SOURCES · DATA</text>
    <text x="80" y="290" font-family="IBM Plex Sans" font-size="74" font-weight="600" fill="${INK}" letter-spacing="-2">The data behind TLI</text>

    <g font-family="IBM Plex Sans">
      <text x="80" y="430" font-size="80" font-weight="500" fill="${INK}" letter-spacing="-2">${provinceCount}</text>
      <text x="80" y="470" font-size="20" fill="${INK_3}" letter-spacing="2" font-weight="500">PROVINCES</text>

      <text x="380" y="430" font-size="80" font-weight="500" fill="${INK}" letter-spacing="-2">${indicatorCount}</text>
      <text x="380" y="470" font-size="20" fill="${INK_3}" letter-spacing="2" font-weight="500">INDICATORS</text>

      <text x="680" y="430" font-size="80" font-weight="500" fill="${INK}" letter-spacing="-2">${sourceCount}</text>
      <text x="680" y="470" font-size="20" fill="${INK_3}" letter-spacing="2" font-weight="500">SOURCES</text>

      <text x="980" y="430" font-size="80" font-weight="500" fill="${BRAND}" letter-spacing="-2">7</text>
      <text x="980" y="470" font-size="20" fill="${INK_3}" letter-spacing="2" font-weight="500">CATEGORIES</text>
    </g>

    ${footer('thailandliveabilityindex.com / about', 'CC BY 4.0')}
  </svg>`;
}

function render(svg, outPath) {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: 'IBM Plex Sans',
    },
    fitTo: { mode: 'width', value: W },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
}

// Main
const scoresPath = path.join(root, 'src/data/scores.json');
if (!fs.existsSync(scoresPath)) {
  console.error('gen-og: src/data/scores.json missing — run `npm run fetch-scores` first');
  process.exit(1);
}
const scores = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));

const outDir = path.join(root, 'public/og');
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
const start = Date.now();

render(homeSvg(), path.join(outDir, 'home.png'));
count++;

for (const p of scores.provinces) {
  render(provinceSvg(p), path.join(outDir, `${p.id}.png`));
  count++;
}

render(methodologySvg(), path.join(outDir, 'methodology.png'));
count++;

const allIndicators = new Set();
const allSources = new Set();
for (const p of scores.provinces) {
  for (const cat of Object.values(p.categories)) {
    for (const ind of cat.indicators) {
      allIndicators.add(ind.id);
      allSources.add(ind.source);
    }
  }
}
render(aboutSvg(scores.provinces.length, allSources.size, allIndicators.size), path.join(outDir, 'about.png'));
count++;

// Default fallback = copy of home.png
fs.copyFileSync(path.join(outDir, 'home.png'), path.join(outDir, 'default.png'));
count++;

console.log(`gen-og: rendered ${count} OG images in ${Date.now() - start}ms → public/og/`);
