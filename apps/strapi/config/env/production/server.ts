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
  proxy: true,
  url: env("APP_URL"), // Sets the public URL of the application.
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
})
