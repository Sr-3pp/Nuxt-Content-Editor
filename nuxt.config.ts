import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  alias: {
    '#content/preview': resolve(fileURLToPath(new URL('.', import.meta.url)), '.nuxt/content/preview.mjs')
  },

  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@nuxt/hints'
  ]
})
