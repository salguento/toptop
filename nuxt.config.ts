// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      apiKey: "", // can be overridden by NUXT_PUBLIC_API_BASE environment variable
      apiBase: "",
    },
  },
});
