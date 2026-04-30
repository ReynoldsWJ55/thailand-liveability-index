import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thailandliveabilityindex.com',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    locales: ['en', 'th'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
