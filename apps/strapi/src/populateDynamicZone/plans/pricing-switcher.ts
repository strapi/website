import type { Modules } from "@strapi/strapi"

import linkPopulate from "../utilities/link"

export default {
  populate: {
    planTypesSwitcher: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"plans.pricing-switcher">
