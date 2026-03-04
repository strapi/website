import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    thumbnail: basicImagePopulate,
    link: linkPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"media.video">
