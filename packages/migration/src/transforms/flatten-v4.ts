import type { TransformFn } from "./base.ts"

/**
 * Flatten v4 response format.
 * v4 wraps fields in `attributes`, this unwraps them to top-level.
 * Already handled by the runner (spreads entity.attributes), but this
 * also handles nested relation data that comes as { data: { id, attributes } }.
 */
/** Fields injected by Strapi Cloud that don't exist in self-hosted v5 */
const STRAPI_CLOUD_FIELDS = ["strapi_stage", "strapi_assignee"]

/** Internal fields that must never reach the target API */
const INTERNAL_FIELDS = ["_hubspotPortalId", "_hubspotFormId"]

export const flattenV4: TransformFn = (entity) => {
  const flat = flattenRelations(entity)

  for (const field of STRAPI_CLOUD_FIELDS) {
    delete flat[field]
  }

  for (const field of INTERNAL_FIELDS) {
    delete flat[field]
  }

  return flat
}

function flattenRelations(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === "_v4Id") {
      result[key] = value
      continue
    }

    if (isV4RelationSingle(value)) {
      result[key] = {
        ...value.data.attributes,
        _v4Id: value.data.id,
      }
      continue
    }

    if (isV4RelationArray(value)) {
      result[key] = value.data.map((item) => ({
        ...item.attributes,
        _v4Id: item.id,
      }))
      continue
    }

    result[key] = value
  }

  return result
}

function isV4RelationSingle(
  value: unknown
): value is { data: { id: number; attributes: Record<string, unknown> } } {
  return (
    value !== null &&
    typeof value === "object" &&
    "data" in value &&
    (value as Record<string, unknown>)["data"] !== null &&
    typeof (value as Record<string, unknown>)["data"] === "object" &&
    "id" in
      ((value as Record<string, unknown>)["data"] as Record<string, unknown>) &&
    "attributes" in
      ((value as Record<string, unknown>)["data"] as Record<string, unknown>)
  )
}

function isV4RelationArray(value: unknown): value is {
  data: { id: number; attributes: Record<string, unknown> }[]
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as Record<string, unknown>)["data"]) &&
    ((value as Record<string, unknown>)["data"] as unknown[]).length > 0 &&
    "attributes" in
      (((value as Record<string, unknown>)["data"] as unknown[])[0] as Record<
        string,
        unknown
      >)
  )
}
