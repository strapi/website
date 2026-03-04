import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"

export default {
  populate: {
    image: basicImagePopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"elements.team-member-item">
