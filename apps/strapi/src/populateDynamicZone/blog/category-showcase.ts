import type { Modules } from "@strapi/strapi"

import { blogPostPopulate } from "./_shared"

export default {
  populate: {
    category: { fields: ["name", "slug"] },
    blogPosts: blogPostPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"blog.category-showcase">
