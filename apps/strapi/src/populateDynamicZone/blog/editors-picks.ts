import type { Modules } from "@strapi/strapi"

import { blogPostPopulate } from "./_shared"

export default {
  populate: {
    blogPosts: blogPostPopulate,
  },
} as Modules.Documents.Params.Populate.NestedParams<"blog.editors-picks">
