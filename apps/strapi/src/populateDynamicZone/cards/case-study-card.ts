import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"

const caseStudyImagePopulate = {
  populate: { image: basicImagePopulate },
}

export default {
  populate: {
    caseStudy: {
      fields: ["title", "slug", "companyName"],
      populate: {
        coverImage: caseStudyImagePopulate,
        logoImage: caseStudyImagePopulate,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"cards.case-study-card">
