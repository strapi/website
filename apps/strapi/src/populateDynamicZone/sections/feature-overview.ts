import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    labelIcon: basicImagePopulate,
    ctaLinks: linkPopulate,
    image: basicImagePopulate,
    items: {
      populate: {
        icon: basicImagePopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.feature-overview">
