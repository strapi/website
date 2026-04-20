import type { Modules } from "@strapi/strapi"

import { blogPostPopulate } from "./_shared"

export default {
  populate: {
    blogPosts: blogPostPopulate,
    category: { fields: ["name", "slug"] },
  },
} as Modules.Documents.Params.Populate.NestedParams<"blog.related-posts">
