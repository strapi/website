import type { Modules } from "@strapi/strapi"

export default {
  populate: { items: true },
} as Modules.Documents.Params.Populate.NestedParams<"sections.faq-section">
