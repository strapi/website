import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"

export default {
  populate: {
    images: basicImagePopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.image-gallery">
