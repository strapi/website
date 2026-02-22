import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    featureBadges: {
      populate: {
        icon: basicImagePopulate,
      },
    },
    featureLogos: basicImagePopulate,
    ctaCards: {
      populate: {
        icon: basicImagePopulate,
        link: linkPopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"footer.footer-cta">
