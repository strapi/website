import type { LifecycleEventType } from "../../../../../types/internals"

function backfillOriginalPublishedAt(
  data: Record<string, unknown> | undefined
) {
  if (!data) return

  if (data["originalPublishedAt"]) return

  const publishedAt = data["publishedAt"]

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
