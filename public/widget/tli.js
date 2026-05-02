/**
 * <tli-widget> — Thailand Liveability Index embeddable Web Component.
 *
 *   <script src="/widget/tli.js" defer></script>
 *   <tli-widget province="phuket" lang="en" size="auto"></tli-widget>
 *
 * Attributes (v1 free tier):
 *   - province  required — slug or DOPA province code (e.g. "phuket", "10")
 *   - lang      en | th — defaults to <html lang="…"> on the host page
 *   - size      auto | 320 | 480 | 800 — defaults to auto (picks by container width)
 *   - api-base  override the data origin (default https://thailandliveabilityindex.com/api/v1)
 *
 * Loads its data from {api-base}/widget-data/{province}.json. Renders inside
 * a closed shadow DOM so host CSS can never leak in or out. Three responsive
 * sizes share the same data payload; the variant is chosen by the container
 * width measured via ResizeObserver.
 *
 * License: MIT (the widget script). Underlying TLI dataset: CC BY-NC 4.0.
 *
 * Copyright (c) 2026 Will Reynolds
 */
(function () {
  'use strict';

  if (customElements.get('tli-widget')) return;

  // Resolve API base. In production this becomes
  // https://thailandliveabilityindex.com/api/v1 (or the embed CDN). For the
  // demo + same-origin embeds, relative path works.
  const DEFAULT_API_BASE =
    (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin + '/api/v1'
      : '/api/v1';

  // Inline the 7 category icons so the widget renders without an extra
  // network round trip and without collisions with the host page's icon
  // sprite. Lucide v0.515.0 — keep in sync if updating.
  const ICONS = {
    'cloud-sun':   '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>',
    'cross':       '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z"/></svg>',
    'route':       '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>',
    'trending-up': '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    'shield':      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    'users-round': '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>',
    'users':       '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  };

  // Score band colors — must match colors_and_type.css.
  const BAND_BG    = ['#B0413E', '#D88555', '#E6C26A', '#82A86A', '#2E7D5B'];
  const BAND_TINT  = ['#F2DAD8', '#F7E4D1', '#F8EECF', '#DEE9D3', '#C9DECF'];
  const BAND_ON    = ['#FFFFFF', '#1A1A1A', '#1A1A1A', '#1A1A1A', '#FFFFFF'];

  // Single stylesheet shared across all instances via Constructable Stylesheets
  // when supported, falls back to inline <style>. Uses CSS custom properties
  // so a partner-id (commercial) can override brand color via JS later.
  const STYLES = `
    /* display: block (not inline-block) so the host always fills its
       container's width — required for the centered flex stage on the
       developers + province pages, and the right default for partner
       sites that drop the widget into a sized container. */
    :host { all: initial; display: block; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; color: #1A1815; box-sizing: border-box; max-width: 100%; }
    *, *::before, *::after { box-sizing: border-box; }
    .w {
      background: #FAF7F2;
      border: 1px solid #E2DFD8;
      border-radius: 12px;
      overflow: hidden;
      width: 100%;
      color: #1A1815;
    }
    .header {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px;
      background: #F2EEE6;
      border-bottom: 1px solid #E2DFD8;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6B6557;
    }
    .brand { font-size: 13px; font-weight: 700; color: #1A1815; letter-spacing: -0.02em; }
    .brand .dot { color: #1F5F6B; }
    .header-meta { margin-left: auto; }
    .footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px;
      border-top: 1px solid #E2DFD8;
      background: #F2EEE6;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 11px;
      color: #6B6557;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .footer a { color: #1F5F6B; text-decoration: none; font-weight: 600; }
    .footer a:hover { text-decoration: underline; }
    .name { font-weight: 600; line-height: 1.2; color: #1A1815; }
    .name-th { font-size: 12px; color: #6B6557; margin-top: 2px; }

    /* === 320 compact === */
    .w--320 .body { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .w--320 .pill {
      flex-shrink: 0;
      width: 56px; height: 56px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 28px;
      font-weight: 500;
      font-feature-settings: "tnum" 1, "lnum" 1;
      position: relative;
      overflow: hidden;
    }
    .w--320 .pill::before {
      content: ""; position: absolute; inset: 0;
      background: repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 4px, transparent 4px 8px);
      pointer-events: none;
    }
    .w--320 .name { font-size: 18px; }
    .w--320 .sub {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 11px;
      color: #6B6557;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* === 480 standard === */
    .w--480 .body { display: grid; grid-template-columns: auto 1fr; gap: 16px; padding: 16px; }
    .w--480 .hero {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px 16px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      min-width: 120px;
    }
    .w--480 .hero::before {
      content: ""; position: absolute; inset: 0 auto 0 0; width: 4px;
    }
    .w--480 .hero-num {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 48px; font-weight: 500; line-height: 1;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
    }
    .w--480 .hero-band {
      font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
      text-transform: uppercase; color: #6B6557;
    }
    .w--480 .name { font-size: 18px; }
    .w--480 .cats {
      margin-top: 8px;
      display: flex; flex-direction: column; gap: 4px;
      font-size: 13px;
    }
    .w--480 .cats > div {
      display: flex; justify-content: space-between; align-items: center;
      color: #423E37;
    }
    .w--480 .cat-label { display: flex; align-items: center; gap: 6px; }
    .w--480 .cat-num {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
      font-weight: 500;
    }

    /* === 800 wide === */
    .w--800 .body { display: grid; grid-template-columns: auto 1fr; gap: 20px; padding: 20px; align-items: center; }
    .w--800 .hero {
      display: flex; flex-direction: column; gap: 6px;
      padding: 16px 20px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      min-width: 200px;
    }
    .w--800 .hero::before {
      content: ""; position: absolute; inset: 0 auto 0 0; width: 6px;
    }
    .w--800 .hero-eyebrow {
      font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
      text-transform: uppercase; color: #6B6557;
    }
    .w--800 .hero-num {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 64px; font-weight: 500; line-height: 1;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
    }
    .w--800 .hero-band { font-size: 14px; font-weight: 600; color: #1A1815; }
    .w--800 .hero-name { margin-top: 6px; }
    .w--800 .name { font-size: 22px; }
    .w--800 .name-th { font-size: 14px; }
    .w--800 .cat-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #E2DFD8;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E2DFD8;
    }
    .w--800 .cat {
      background: #FAF7F2;
      padding: 10px 8px;
      display: flex; flex-direction: column; gap: 2px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .w--800 .cat::before {
      content: ""; position: absolute; inset: auto 0 0 0; height: 3px;
    }
    .w--800 .cat-num {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 20px; font-weight: 500; line-height: 1;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
    }
    .w--800 .cat-mini {
      font-size: 10px; font-weight: 500; line-height: 1.1;
      color: #6B6557;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    /* === 1024 profile — hero embed, comparable to the province page card ===
       Wider canvas: composite hero on the left, all 7 categories as a
       2-row grid in the middle with name + score + colored progress bar,
       optional standout strip on the right. The richest Walk Score-style
       embed for partners who want a substantial profile, not a sticker. */
    .w--1024 .body {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      padding: 24px;
    }
    .w--1024 .hero {
      display: flex; flex-direction: column; gap: 8px;
      padding: 20px 24px;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }
    .w--1024 .hero::before {
      content: ""; position: absolute; inset: 0 auto 0 0; width: 6px;
    }
    .w--1024 .hero-eyebrow {
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: #6B6557;
    }
    .w--1024 .hero-num {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 88px; font-weight: 500; line-height: 0.95;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
      letter-spacing: -2px;
    }
    .w--1024 .hero-band { font-size: 14px; font-weight: 600; color: #1A1815; }
    .w--1024 .hero-name { margin-top: 10px; }
    .w--1024 .name { font-size: 22px; }
    .w--1024 .name-th { font-size: 14px; }
    .w--1024 .hero-region {
      margin-top: 6px; font-size: 12px; color: #6B6557;
      letter-spacing: 0.04em; text-transform: uppercase;
    }
    .w--1024 .cat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .w--1024 .cat-row {
      display: grid; grid-template-columns: 1fr auto;
      grid-template-areas: "label score" "bar bar";
      align-items: center;
      gap: 6px 12px;
      padding: 10px 12px;
      background: #F2EEE6;
      border: 1px solid #E2DFD8;
      border-radius: 8px;
    }
    .w--1024 .cat-row__label {
      grid-area: label;
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500; color: #423E37;
    }
    .w--1024 .cat-row__score {
      grid-area: score;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 18px; font-weight: 600;
      font-feature-settings: "tnum" 1, "lnum" 1;
      color: #1A1815;
    }
    .w--1024 .cat-row__bar {
      grid-area: bar;
      height: 5px; border-radius: 999px;
      background: #E2DFD8;
      overflow: hidden;
      position: relative;
    }
    .w--1024 .cat-row__bar > span {
      display: block; height: 100%;
      transition: width 300ms ease;
    }

    @media (prefers-reduced-motion: no-preference) {
      .w { transition: opacity 200ms ease; }
    }
    .w[hidden] { display: none; }
    .skeleton {
      padding: 24px;
      font-size: 13px;
      color: #6B6557;
      text-align: center;
    }
    .err {
      padding: 16px;
      font-size: 13px;
      color: #B0413E;
      background: #F2DAD8;
      border-radius: 8px;
    }
  `;

  // Constructable Stylesheets — one shared sheet across all instances.
  let SHEET = null;
  if (typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype) {
    try { SHEET = new CSSStyleSheet(); SHEET.replaceSync(STYLES); } catch (_) { SHEET = null; }
  }

  // In-flight + done cache so multiple <tli-widget province="bangkok"> on the
  // same page result in exactly one fetch.
  const dataCache = new Map();
  function fetchData(apiBase, id) {
    const key = apiBase + '|' + id;
    const hit = dataCache.get(key);
    if (hit) return hit;
    const url = `${apiBase}/widget-data/${encodeURIComponent(id)}.json`;
    const promise = fetch(url, { credentials: 'omit' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    dataCache.set(key, promise);
    promise.catch(() => dataCache.delete(key));
    return promise;
  }

  function pickSize(width) {
    if (width >= 920) return 1024;
    if (width >= 700) return 800;
    if (width >= 420) return 480;
    return 320;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function render(host, data, size, lang) {
    const name    = lang === 'th' ? data.name.th : data.name.en;
    const nameAlt = lang === 'th' ? data.name.en : data.name.th;
    const altLang = lang === 'th' ? 'en' : 'th';
    const bandBg   = BAND_BG[data.band];
    const bandTint = BAND_TINT[data.band];
    const bandOn   = BAND_ON[data.band];
    const bandLabel = data.band_label;
    const cats = data.categories;
    const top3 = data.top3;
    const asOf = data.as_of ? `AS OF ${data.as_of}` : 'AS OF — pending';
    const deeplink = (lang === 'th' ? data.deeplink.th : data.deeplink.en) || '#';
    const sourceLabel = lang === 'th' ? `แหล่ง · TLI ${data.as_of || ''}`.trim() : `SOURCE · TLI ${data.as_of || ''}`.trim();
    const fullReport = lang === 'th' ? `ดูรายงาน${name} →` : `Full ${name} report →`;
    const liveabilityLabel = lang === 'th' ? 'คะแนนคุณภาพการอยู่อาศัย' : 'LIVEABILITY SCORE';
    const compositeLabel = lang === 'th' ? 'คะแนนรวม' : 'COMPOSITE';
    const rankSep = lang === 'th' ? `${bandLabel} · อันดับ ${data.rank}/77` : `${bandLabel} · RANK ${data.rank}/77`;

    let body = '';
    if (size === 320) {
      body = `
        <div class="body">
          <div class="pill" style="background:${bandBg};color:${bandOn};">${data.composite}</div>
          <div>
            <div class="name">${escapeHtml(name)}</div>
            <div class="sub">${escapeHtml(rankSep)}</div>
          </div>
        </div>
        <div class="footer">
          <span>${escapeHtml(asOf)}</span>
          <a href="${escapeHtml(deeplink)}" target="_blank" rel="noopener">${escapeHtml(fullReport)}</a>
        </div>`;
    } else if (size === 480) {
      const catsHtml = top3.map((c) => `
        <div>
          <span class="cat-label">${ICONS[c.icon] || ''}<span>${escapeHtml(lang === 'th' ? c.label_th : c.label_en)}</span></span>
          <span class="cat-num">${c.score}</span>
        </div>`).join('');
      body = `
        <div class="body">
          <div class="hero" style="background:${bandTint};">
            <span class="hero-num">${data.composite}</span>
            <span class="hero-band">${escapeHtml(bandLabel)}</span>
          </div>
          <div>
            <div class="name">${escapeHtml(name)}</div>
            <div class="name-th" lang="${altLang}">${escapeHtml(nameAlt)}</div>
            <div class="cats">${catsHtml}</div>
          </div>
        </div>
        <style>.w--480 .hero::before { background:${bandBg} !important; }</style>
        <div class="footer">
          <span>${escapeHtml(sourceLabel)}</span>
          <a href="${escapeHtml(deeplink)}" target="_blank" rel="noopener">${escapeHtml(lang === 'th' ? 'ดูครบ 7 หมวด →' : 'View all 7 →')}</a>
        </div>`;
    } else if (size === 800) {
      const cells = cats.map((c) => `
        <div class="cat" style="--cb:${BAND_BG[c.band]};">
          <span class="cat-num">${c.score}</span>
          <span class="cat-mini">${escapeHtml(lang === 'th' ? c.short_th : c.short_en)}</span>
        </div>`).join('');
      body = `
        <div class="body">
          <div class="hero" style="background:${bandTint};">
            <span class="hero-eyebrow">${escapeHtml(compositeLabel)}</span>
            <span class="hero-num">${data.composite}</span>
            <span class="hero-band">${escapeHtml(bandLabel.charAt(0) + bandLabel.slice(1).toLowerCase())} · ${data.rank}/77</span>
            <div class="hero-name">
              <div class="name">${escapeHtml(name)}</div>
              <div class="name-th" lang="${altLang}">${escapeHtml(nameAlt)}</div>
            </div>
          </div>
          <div>
            <div class="cat-row">${cells}</div>
          </div>
        </div>
        <style>
          .w--800 .hero::before { background:${bandBg}; }
          .w--800 .cat::before { background: var(--cb, #82A86A); }
        </style>
        <div class="footer">
          <span>${escapeHtml(asOf)} · ${cats.length} ${lang === 'th' ? 'หมวด' : 'CATEGORIES'} · ${lang === 'th' ? 'ระเบียบวิธีเปิด' : 'OPEN METHODOLOGY'}</span>
          <a href="${escapeHtml(deeplink)}" target="_blank" rel="noopener">${escapeHtml(fullReport)}</a>
        </div>`;
    } else {
      // size === 1024 — Profile / hero embed.
      const region = lang === 'th' ? data.region.th : data.region.en;
      const profileLabel = lang === 'th' ? 'โปรไฟล์คุณภาพการอยู่อาศัย' : 'LIVEABILITY PROFILE';
      const rows = cats.map((c) => `
        <div class="cat-row">
          <span class="cat-row__label">${ICONS[c.icon] || ''}<span>${escapeHtml(lang === 'th' ? c.label_th : c.label_en)}</span></span>
          <span class="cat-row__score">${c.score}</span>
          <span class="cat-row__bar"><span style="width:${Math.max(0, Math.min(100, c.score))}%;background:${BAND_BG[c.band]};"></span></span>
        </div>`).join('');
      body = `
        <div class="body">
          <div class="hero" style="background:${bandTint};">
            <span class="hero-eyebrow">${escapeHtml(compositeLabel)} · ${escapeHtml(profileLabel)}</span>
            <span class="hero-num">${data.composite}</span>
            <span class="hero-band">${escapeHtml(bandLabel.charAt(0) + bandLabel.slice(1).toLowerCase())} · ${lang === 'th' ? 'อันดับ' : 'rank'} ${data.rank}/77</span>
            <div class="hero-name">
              <div class="name">${escapeHtml(name)}</div>
              <div class="name-th" lang="${altLang}">${escapeHtml(nameAlt)}</div>
            </div>
            <div class="hero-region">${escapeHtml(region)}</div>
          </div>
          <div class="cat-grid">${rows}</div>
        </div>
        <style>.w--1024 .hero::before { background:${bandBg}; }</style>
        <div class="footer">
          <span>${escapeHtml(asOf)} · ${cats.length} ${lang === 'th' ? 'หมวด' : 'CATEGORIES'} · CC BY-NC 4.0</span>
          <a href="${escapeHtml(deeplink)}" target="_blank" rel="noopener">${escapeHtml(fullReport)}</a>
        </div>`;
    }

    host._root.innerHTML = `
      <div class="w w--${size}" role="figure" aria-label="${escapeHtml(name)} liveability score: ${data.composite} of 100, ${escapeHtml(bandLabel)}">
        <div class="header">
          <span class="brand">TLI<span class="dot">.</span></span>
          <span class="header-meta">${escapeHtml(size === 320 ? liveabilityLabel : (lang === 'th' ? 'ดัชนีคุณภาพการอยู่อาศัยของไทย' : 'THAILAND LIVEABILITY INDEX'))}</span>
        </div>
        ${body}
      </div>
    `;
  }

  function renderSkeleton(host) {
    host._root.innerHTML = '<div class="w"><div class="skeleton">Loading TLI…</div></div>';
  }
  function renderError(host, msg) {
    host._root.innerHTML = `<div class="w"><div class="err">${escapeHtml(msg)}</div></div>`;
  }

  class TliWidget extends HTMLElement {
    static get observedAttributes() { return ['province', 'lang', 'size', 'api-base']; }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'closed' });
      this._root = shadow;
      // Attach styles.
      if (SHEET) shadow.adoptedStyleSheets = [SHEET];
      else { const s = document.createElement('style'); s.textContent = STYLES; shadow.appendChild(s); }
      this._data = null;
      this._currentSize = null;
    }

    connectedCallback() {
      this._ro = new ResizeObserver(() => this._maybeRerender());
      this._ro.observe(this);
      renderSkeleton(this);
      this._loadAndRender();
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      if (name === 'province' || name === 'api-base') this._loadAndRender();
      else this._maybeRerender();
    }

    _resolveLang() {
      const explicit = this.getAttribute('lang');
      if (explicit === 'en' || explicit === 'th') return explicit;
      const docLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      return docLang.startsWith('th') ? 'th' : 'en';
    }

    _resolveSize() {
      const attr = (this.getAttribute('size') || 'auto').toLowerCase();
      if (attr === '320' || attr === '480' || attr === '800' || attr === '1024') return parseInt(attr, 10);
      if (attr === 'profile') return 1024;
      const w = this.getBoundingClientRect().width || 480;
      return pickSize(w);
    }

    _maybeRerender() {
      if (!this._data) return;
      const size = this._resolveSize();
      const lang = this._resolveLang();
      if (size === this._currentSize && lang === this._currentLang) return;
      this._currentSize = size; this._currentLang = lang;
      render(this, this._data, size, lang);
    }

    _loadAndRender() {
      const province = this.getAttribute('province');
      if (!province) { renderError(this, 'Missing province attribute'); return; }
      const apiBase = this.getAttribute('api-base') || DEFAULT_API_BASE;
      fetchData(apiBase, province)
        .then((data) => {
          this._data = data;
          this._currentSize = null; this._currentLang = null;
          this._maybeRerender();
        })
        .catch((err) => {
          renderError(this, `TLI: could not load "${province}" (${err.message})`);
        });
    }
  }

  customElements.define('tli-widget', TliWidget);
})();
