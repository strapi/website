import type { Modules } from "@strapi/strapi"

import featureOverviewPopulate from "./feature-overview"
import basicImagePopulate from "../utilities/basic-image"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    tabs: {
      populate: {
        tabIcon: basicImagePopulate,
        content: featureOverviewPopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.tabbed-feature-overview">
