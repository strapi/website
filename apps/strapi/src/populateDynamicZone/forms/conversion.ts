import type { Modules } from "@strapi/strapi"

import hubspotFormSsrPopulate from "./hubspot-form-ssr"
import basicImagePopulate from "../utilities/basic-image"
import sectionHeaderPopulate from "../utilities/section-header"

export const conversionPopulateFields = {
  section: sectionHeaderPopulate,
  features: {
    populate: {
      icon: basicImagePopulate,
    },
  },
  infoBlocks: {
    populate: {
      logos: basicImagePopulate,
      items: {
        populate: {
          image: basicImagePopulate,
        },
      },
    },
  },
}

export default {
  populate: {
    ...conversionPopulateFields,
    form: hubspotFormSsrPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"forms.conversion">
