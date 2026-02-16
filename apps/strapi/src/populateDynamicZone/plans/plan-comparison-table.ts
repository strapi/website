import type { Modules } from "@strapi/strapi"

export default {
  populate: {
    plans: {
      populate: {
        features: {
          populate: {
            feature: {
              fields: ["id", "name", "category", "order", "description"],
              populate: {
                tooltip: true,
              },
            },
          },
        },
      },
    },
  },
} satisfies Modules.Documents.Params.Populate.NestedParams<"plans.plan-comparison-table">
