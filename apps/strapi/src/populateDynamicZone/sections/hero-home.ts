import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    cta: {
      populate: {
        cta: linkPopulate,
      },
    },
    testimonials: {
      populate: {
        logos: basicImagePopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.hero-home">
