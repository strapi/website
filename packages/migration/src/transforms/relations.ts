import type { TransformFn } from "./base.ts"

/**
 * Resolve v4 relation IDs to v5 documentIds using the IdMap.
 * Takes a config of field → contentType pairs.
 */
export function resolveRelations(
  fieldMap: Record<string, string>
): TransformFn {
  return (entity, ctx) => {
    const result = { ...entity }

    for (const [field, contentType] of Object.entries(fieldMap)) {
      const value = result[field]

      if (value === null || value === undefined) continue

      if (
        typeof value === "object" &&
        "_v4Id" in (value as Record<string, unknown>)
      ) {
        const v4Id = (value as Record<string, unknown>)["_v4Id"] as number
        const v5DocId = ctx.idMap.get(contentType, v4Id)

        if (v5DocId) {
          result[field] = { documentId: v5DocId }
        } else {
          ctx.logger.warn(
            `Unresolved relation: ${field} v4Id=${v4Id} (${contentType})`
          )
          result[field] = null
        }

        continue
      }

      if (Array.isArray(value)) {
        result[field] = value
          .map((item) => {
            if (typeof item === "object" && item && "_v4Id" in item) {
              const v4Id = item._v4Id as number
              const v5DocId = ctx.idMap.get(contentType, v4Id)

              if (v5DocId) {
                return { documentId: v5DocId }
              }

              ctx.logger.warn(
                `Unresolved relation: ${field}[] v4Id=${v4Id} (${contentType})`
              )

              return null
            }

            return item
          })
          .filter(Boolean)
      }
    }

    return result
  }
}
