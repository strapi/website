import type { Modules } from "@strapi/strapi"

import { conversionPopulateFields } from "./conversion"

export default {
  populate: {
    ...conversionPopulateFields,
    form: {
      populate: {
        form: true,
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"forms.demo-conversion">
