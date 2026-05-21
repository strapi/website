import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    items: {
      populate: {
        logo: basicImagePopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.news-list">
