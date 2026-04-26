import type { StrapiApp } from "@strapi/strapi/admin"

import "@repo/design-system/styles.css"

import DataRevalidate from "./extensions/DataRevalidate"
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
    app
      .getPlugin("content-manager")
      .injectComponent("editView", "right-links", {
        name: "DataRevalidate",
        Component: DataRevalidate,
      })
  },
}
