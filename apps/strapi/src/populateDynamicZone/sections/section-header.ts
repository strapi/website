import type { Modules } from "@strapi/strapi"

import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.section-header">
