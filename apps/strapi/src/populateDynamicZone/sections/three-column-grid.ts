import type { Modules } from "@strapi/strapi"

import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    items: {
      populate: {
        icon: {
          populate: {
            media: true,
          },
        },
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.three-column-grid">
