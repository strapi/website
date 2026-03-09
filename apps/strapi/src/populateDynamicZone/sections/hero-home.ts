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
    rotatingPhrases: true,
    testimonials: {
      populate: {
        logos: basicImagePopulate,
      },
    },
    features: {
      populate: {
        icon: basicImagePopulate,
        media: true,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.hero-home">
