/**
 * Recursively strip `id` fields from an object.
 * Strapi v5 PUT rejects payloads containing `id` fields.
 */
export function stripIds(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripIds)
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === "id") continue
      result[key] = stripIds(value)
    }

    return result
  }

  return obj
}
