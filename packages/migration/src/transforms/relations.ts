import type { TransformFn } from "./base.ts"

/**
 * Resolve v4 relation IDs to v5 documentIds using the IdMap.
 * Takes a config of field → contentType pairs.
 *
 * Strapi v5 REST API requires relations in `connect` format:
 *   Single relation (manyToOne): { set: [documentId] }
 *   Array relation (oneToMany/manyToMany): { set: [docId1, docId2] }
 */
export function resolveRelations(
  fieldMap: Record<string, string>
): TransformFn {
  return (entity, ctx) => {
    const result = { ...entity }

    for (const [field, contentType] of Object.entries(fieldMap)) {
      const value = result[field]

      if (value === null || value === undefined) continue

      // Single relation (flattened v4 object with _v4Id)
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        "_v4Id" in (value as Record<string, unknown>)
      ) {
        const v4Id = (value as Record<string, unknown>)["_v4Id"] as number
        const v5DocId = ctx.idMap.get(contentType, v4Id)

        if (v5DocId) {
          result[field] = { set: [v5DocId] }
        } else {
          ctx.logger.warn(
            `Unresolved relation: ${field} v4Id=${v4Id} (${contentType})`
          )
          result[field] = null
        }

        continue
      }

      // Array relation (flattened v4 array of objects with _v4Id)
      if (Array.isArray(value)) {
        const resolved = value
          .map((item) => {
            if (typeof item === "object" && item && "_v4Id" in item) {
              const v4Id = item._v4Id as number
              const v5DocId = ctx.idMap.get(contentType, v4Id)

              if (v5DocId) {
                return v5DocId
              }

              ctx.logger.warn(
                `Unresolved relation: ${field}[] v4Id=${v4Id} (${contentType})`
              )

              return null
            }

            return null
          })
          .filter(Boolean) as string[]

        if (resolved.length > 0) {
          result[field] = { set: resolved }
        } else {
          result[field] = null
        }
      }
    }

    return result
  }
}
