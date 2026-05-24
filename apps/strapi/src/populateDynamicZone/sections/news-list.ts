import type { Modules } from "@strapi/strapi"

/**
 * News List has no attributes — it's a marker the frontend uses to render
 * an auto-fetched chronological list. Populate config exists for parity with
 * sibling sections so dynamic-zone populate helpers can resolve it.
 */
export default {
  populate: {},
} as Modules.Documents.Params.Populate.NestedParams<"sections.news-list">
