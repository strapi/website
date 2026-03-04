import type { Modules } from "@strapi/strapi"

import testimonyItemPopulate from "../elements/testimony-item"

export default {
  populate: {
    items: testimonyItemPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.testimonies">
