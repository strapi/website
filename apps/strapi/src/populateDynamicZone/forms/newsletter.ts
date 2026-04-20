import type { Modules } from "@strapi/strapi"

export default {
  populate: {
    hubspotForm: true,
  },
} as Modules.Documents.Params.Populate.NestedParams<"forms.newsletter">
