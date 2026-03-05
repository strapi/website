import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    ctas: linkPopulate,
    image: basicImagePopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.hero">
