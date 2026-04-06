import type { Modules } from "@strapi/strapi"

import { blogPostPopulate } from "./_shared"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    blogPosts: blogPostPopulate,
    category: { fields: ["name", "slug"] },
  },
} as Modules.Documents.Params.Populate.NestedParams<"blog.related-posts">
