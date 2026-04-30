import { defineConfig } from 'astro/config';

// https://astro.build/config
//
// COMING-SOON BRANCH config — single-page splash, no i18n, no sitemap.
// The full multi-locale config lives on `main` and ships when CF Pages
// production branch flips to `main`. This config keeps coming-soon's
// build minimal so it has zero dependency on scores.json or fetch-scores.
export default defineConfig({
  site: 'https://thailandliveabilityindex.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
});
