import type { StrapiApp } from "@strapi/strapi/admin"

import "@repo/design-system/styles.css"

import InternalJobs from "./extensions/InternalJobs"

export default {
  config: {
    locales: ["en"],
  },
  async bootstrap(app: StrapiApp) {
    app.getPlugin("content-manager").injectComponent("listView", "actions", {
      name: "InternalJobs",
      Component: InternalJobs,
    })
  },
}
