import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig, envField } from 'astro/config';
import icon from 'astro-icon';
import metaTags from 'astro-meta-tags';

// https://astro.build/config
export default defineConfig({
  site: getSiteUrl(),
  experimental: {
    env: {
      schema: {
        PUBLIC_UMAMI_WEBSITE_ID: envField.string({ context: 'client', access: 'public', optional: true }),
        PUBLIC_POSTHOG_API_HOST: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
        PUBLIC_POSTHOG_API_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      },
    },
  },
  integrations: [
    metaTags(),
    mdx(),
    icon(),
    tailwind(),
    sitemap({ filter: (url) => new URL(url).pathname === '/' }),
    {
      name: 'remove-asset-sites',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await Promise.all([removeIfExists(join(dir.pathname, 'og')), removeIfExists(join(dir.pathname, 'pdf'))]);
        },
      },
    },
  ],
});

async function removeIfExists(path: string) {
  if (existsSync(path)) {
    await rm(path, { recursive: true });
  }
}

function getSiteUrl() {
  if (process.env.NETLIFY) return process.env.URL;
  if (process.env.VERCEL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER) return process.env.RENDER_EXTERNAL_URL;
  if (process.env.CF_PAGES) return process.env.CF_PAGES_URL;
  if (process.env.ASTRO_SITE_URL) return process.env.ASTRO_SITE_URL;

  if (process.env.CI) {
    console.error('Site URL not not found. Please set the ASTRO_SITE_URL environment variable.');
    process.exit(1);
  }

  return 'http://localhost:4321';
}
