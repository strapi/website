import type { TransformFn, TransformContext } from "./base.ts"
import type { ComponentMapping } from "../config/components.ts"

const DATA_SINK_COMPONENT = "migration.data-sink"

interface DynamicZoneEntry {
  __component: string
  [key: string]: unknown
}

/**
 * Remap a dynamic zone field from v4 to v5.
 * - Renames the field (e.g. "slices" → "content")
 * - Remaps component UIDs using the component mapping config
 * - Uses full-component `transform` when available, otherwise `fieldMap`
 * - Supports multi-emit: a transform returning an array expands into
 *   multiple entries in the target dynamic zone
 * - Routes unmapped/dropped components to the data-sink component
 *   so their content is preserved for future re-migration
 */
export function remapDynamicZone(
  sourceField: string,
  targetField: string
): TransformFn {
  return (entity, ctx) => {
    const entries = entity[sourceField] as DynamicZoneEntry[] | undefined

    if (!entries || !Array.isArray(entries)) {
      const { [sourceField]: _, ...rest } = entity

      return rest
    }

    const mapped: DynamicZoneEntry[] = []

    for (const entry of entries) {
      const mapping = findMapping(entry.__component, ctx.componentMap)

      if (!mapping) {
        ctx.logger.warn(
          `No mapping for component: ${entry.__component} — routing to data-sink`
        )
        mapped.push(toDataSink(entry))
        continue
      }

      if (mapping.target === null) {
        ctx.logger.debug(`Sinking component: ${entry.__component}`)
        mapped.push(toDataSink(entry))
        continue
      }

      // Full-component transform takes priority over fieldMap
      if (mapping.transform) {
        const { __component: _, id: __, ...fields } = entry
        const result = mapping.transform(fields)

        if (Array.isArray(result)) {
          // Multi-emit: one source entry → multiple target entries
          for (const item of result) {
            mapped.push({ __component: mapping.target, ...item })
          }

          ctx.logger.debug(
            `Expanded ${entry.__component} → ${result.length}× ${mapping.target}`
          )
        } else {
          mapped.push({ __component: mapping.target, ...result })
        }

        continue
      }

      // Legacy fieldMap path
      const transformed = applyFieldMap(entry, mapping, ctx)
      transformed.__component = mapping.target
      mapped.push(transformed)
    }

    const { [sourceField]: _, ...rest } = entity

    if (mapped.length > 0) {
      return { ...rest, [targetField]: mapped }
    }

    return rest
  }
}

function findMapping(
  componentUid: string,
  componentMap: ComponentMapping[]
): ComponentMapping | undefined {
  return componentMap.find((m) => m.source === componentUid)
}

function applyFieldMap(
  entry: DynamicZoneEntry,
  mapping: ComponentMapping,
  ctx: TransformContext
): DynamicZoneEntry {
  if (!mapping.fieldMap) {
    const { __component: _, id: __, ...fields } = entry

    return { __component: "", ...fields }
  }

  const result: DynamicZoneEntry = { __component: "" }

  for (const [sourceKey, targetDef] of Object.entries(mapping.fieldMap)) {
    const value = entry[sourceKey]
    if (value === undefined) continue

    if (typeof targetDef === "string") {
      setNestedValue(result, targetDef, value)
    } else {
      const targetKey = targetDef.rename ?? sourceKey
      const transformedValue = targetDef.transform
        ? targetDef.transform(value)
        : value
      setNestedValue(result, targetKey, transformedValue)
    }
  }

  // Pass through unmapped fields if configured
  if (mapping.unmappedFields !== "drop") {
    for (const [key, value] of Object.entries(entry)) {
      if (key === "__component" || key === "id") continue
      if (mapping.fieldMap[key]) continue

      if (mapping.unmappedFields === "warn") {
        ctx.logger.warn(`Unmapped field: ${mapping.source}.${key}`)
      }

      result[key] = value
    }
  }

  return result
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".")

  if (parts.length === 1) {
    obj[path] = value

    return
  }

  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!

    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {}
    }

    current = current[part] as Record<string, unknown>
  }

  current[parts.at(-1)!] = value
}

/** Wrap a v4 entry into a data-sink component preserving all original data */
function toDataSink(entry: DynamicZoneEntry): DynamicZoneEntry {
  const { __component, id: _, ...fields } = entry

  return {
    __component: DATA_SINK_COMPONENT,
    sourceComponent: __component,
    data: fields,
  }
}
