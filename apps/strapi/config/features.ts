export default ({ env }) => ({
  future: {
    // New Media Library UI (beta, Strapi >= 5.52.2). Set to false and restart
    // to return to the legacy UI — no assets, folders or settings are lost.
    betaMediaLibrary: env.bool("STRAPI_FUTURE_BETA_MEDIA_LIBRARY", false),
  },
})
