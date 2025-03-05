// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    preset: 'static'
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
  ],
})
