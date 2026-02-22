import type { Modules } from "@strapi/strapi"

export default {
  populate: {
    items: {
      populate: {
        icon: {
          populate: {
            media: true,
          },
        },
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.how-it-works">
