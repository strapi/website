import type { LifecycleEventType } from "../../../../../types/internals"

function backfillOriginalPublishedAt(
  data: Record<string, unknown> | undefined
) {
  if (!data) return

  if (data["originalPublishedAt"]) return

  const publishedAt = data["publishedAt"]

  // Strapi v5 sometimes hands publishedAt to lifecycle hooks as a Date,
  // sometimes as an ISO string — normalize both.
  if (publishedAt instanceof Date) {
    data["originalPublishedAt"] = publishedAt.toISOString()

    return
  }

  if (typeof publishedAt === "string" && publishedAt.length > 0) {
    data["originalPublishedAt"] = publishedAt
  }
}

export default {
  async beforeCreate(event: LifecycleEventType<"beforeCreate">) {
    backfillOriginalPublishedAt(
      event.params.data as Record<string, unknown> | undefined
    )
  },

  async beforeUpdate(event: LifecycleEventType<"beforeUpdate">) {
    backfillOriginalPublishedAt(
      event.params.data as Record<string, unknown> | undefined
    )
  },
}
