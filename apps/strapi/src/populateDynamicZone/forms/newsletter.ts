import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"

export default {
  populate: {
    image: basicImagePopulate,
    hubspotForm: true,
  },
} as Modules.Documents.Params.Populate.NestedParams<"forms.newsletter">
