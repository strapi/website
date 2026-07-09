const cronTasks = {
  sayHelloJob: {
    task: ({ strapi }) => {
      console.warn("A beautiful start to the week!")
    },
    options: {
      rule: "0 0 1 * * 1",
    },
  },
}

export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("APP_URL"),
  app: {
    keys: env.array("APP_KEYS"),
  },
  webhooks: {
    populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
  },
  cron: {
    enabled: env.bool("CRON_ENABLED", false),
    tasks: cronTasks,
  },
  /**
   * MCP endpoint at `/mcp` (Strapi >= 5.47). Authenticated via admin tokens —
   * each token only exposes tools matching its admin permissions.
   */
  mcp: {
    enabled: env.bool("STRAPI_MCP_ENABLED", true),
  },
})
