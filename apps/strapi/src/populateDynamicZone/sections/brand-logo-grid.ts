import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    items: {
      populate: {
        image: basicImagePopulate,
        link: linkPopulate,
        tooltip: true,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.brand-logo-grid">
