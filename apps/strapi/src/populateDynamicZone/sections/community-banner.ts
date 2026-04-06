import type { Modules } from "@strapi/strapi"

import linkPopulate from "../utilities/link"

export default {
  populate: {
    ctaLink: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.community-banner">
