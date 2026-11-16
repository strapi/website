import type { Modules } from "@strapi/strapi"

export default {
  populate: {
    legalPages: {
      fields: ["title", "slug", "content"],
      populate: {
        seo: {
          populate: {
            metaImage: true,
            metaSocial: { populate: { image: true } },
          },
        },
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.legal-pages">
