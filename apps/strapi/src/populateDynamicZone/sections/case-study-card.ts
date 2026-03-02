import type { Modules } from "@strapi/strapi"

import basicImagePopulate from "../utilities/basic-image"
import linkTextPopulate from "../utilities/link-text"

export default {
  populate: {
    image: basicImagePopulate,
    ctaLink: linkTextPopulate,
    backgroundImage: basicImagePopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.case-study-card">
