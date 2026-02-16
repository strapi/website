import type { Modules } from "@strapi/strapi"

import linkPopulate from "../utilities/link"

export default {
  populate: {
    features: true,
    link: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"plans.plan-pricing-extra-box">
