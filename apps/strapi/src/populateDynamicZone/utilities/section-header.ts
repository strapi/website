import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "./basic-image"
import linkPopulate from "./link"

export default {
  populate: {
    labelIcon: basicImagePopulate,
    ctaLinks: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"utilities.section-header">
