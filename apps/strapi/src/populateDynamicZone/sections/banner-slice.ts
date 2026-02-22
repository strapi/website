import type { Modules } from "@strapi/strapi"

import linkPopulate from "../utilities/link"

export default {
  populate: {
    ctas: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.banner-slice">
