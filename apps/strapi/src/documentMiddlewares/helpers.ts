import type { Core, UID } from "@strapi/strapi"
import { errors } from "@strapi/utils"

import { getPopulateDynamicZoneConfig } from "../populateDynamicZone"

interface DynamicZoneAttributeMeta {
  readonly type?: string
  readonly components?: readonly string[]
}

/**
 * Strapi v5 rejects shallow `populate: { myZone: true }` on dynamic zones in some
 * code paths (ValidationError: invalid nested keys like `image`). Prefetch using
 * explicit `on` + minimal fields per allowed component UID instead.
 */
function buildDynamicZonePrefetchPopulate(
  strapi: Core.Strapi,
  uid: UID.ContentType,
  zoneNames: readonly string[]
): Record<string, unknown> {
  const meta = strapi.db.metadata.get(uid)
  const attrs = meta?.attributes as
    | Record<string, DynamicZoneAttributeMeta>
    | undefined

  if (!attrs) {
    return Object.fromEntries(zoneNames.map((zone) => [zone, true]))
  }

  const result: Record<string, unknown> = {}

  for (const zoneName of zoneNames) {
    const attr = attrs[zoneName]
    const isDynamicZone =
      attr?.type === "dynamiczone" || attr?.type === "dynamicZone"
    const components = attr?.components

    result[zoneName] =
      isDynamicZone && Array.isArray(components) && components.length > 0
        ? {
            on: Object.fromEntries(
              components.map((componentUid) => [
                componentUid,
                { fields: ["__component", "id"] },
              ])
            ),
          }
        : true
  }

  return result
}

/**
 * Normalize the input to always have an array of strings
 * representing the dynamic zones
 */
export const normalizeDynamicZonePopulate = (
  populateDynamicZone: string[] | string | undefined
) => {
  if (!populateDynamicZone) {
    return []
  }

  if (typeof populateDynamicZone === "string") {
    return [populateDynamicZone]
  }

  if (
    typeof populateDynamicZone === "object" &&
    !Array.isArray(populateDynamicZone)
  ) {
    return Object.keys(populateDynamicZone).map((key) => key)
  }

  return populateDynamicZone
}

/**
 * Get general populate config for dynamic zones based on the
 * filesystem structure and check if it exists.
 */
export const getPopulateConfig = () => {
  const populateConfig = getPopulateDynamicZoneConfig()
  if (!populateConfig) {
    throw new errors.ValidationError(
      `Populate config not found. Ensure the filesystem-based dynamic zone populate configuration exists in the expected structure and that it is correctly exported.`
    )
  }

  return populateConfig
}

/**
 * Build the final populate object for Strapi based on the components that need to be populated
 * for each dynamic zone and the general config for those components. The resulting object will have the format:
 *
 * @returns
 * {
 *   "dynamicZoneName": {
 *     on: {
 *.      "component.uid": { ...populateConfigForThatComponent }
 *     }
 *  }
 *   "secondDynamicZoneName": {
 *     on: {
 *       "component.uid": { ...populateConfigForThatComponent }
 *     }
 *   }
 * }
 */
export const createComponentsPopulateObject = (
  componentsToPopulate: Record<string, string[]>
): Record<string, { on: Record<string, unknown> }> => {
  const populateConfig = getPopulateConfig()

  return Object.fromEntries(
    Object.entries(componentsToPopulate).map(
      ([zone, components]: [string, string[]]) => [
        zone,
        {
          on: Object.fromEntries(
            components
              .filter((c) => c in populateConfig)
              .map((c) => [c, populateConfig[c]])
          ),
        },
      ]
    )
  )
}

/**
 * Prefetch dynamic zone data and extract the unique components
 * that need to be populated for each dynamic zone.
 */
export const getComponentsToPopulate = async (
  strapi: Core.Strapi,
  dynamicZonePopulate: string[],
  context: {
    uid: UID.ContentType
    action: string
    documentId: string | number
    locale?: string
  }
): Promise<Record<string, string[]>> => {
  const prefetchPopulate = buildDynamicZonePrefetchPopulate(
    strapi,
    context.uid,
    dynamicZonePopulate
  )

  const prefetchedData = await strapi
    .documents(context.uid)
    [context.action].call(this, {
      documentId: context.documentId,
      populate: prefetchPopulate,
      fields: ["documentId"],
      locale: context.locale,
    })

  const entries = Array.isArray(prefetchedData)
    ? prefetchedData
    : [prefetchedData]

  const componentsToPopulate = {}

  for (const attr of dynamicZonePopulate) {
    const components = new Set<string>()

    for (const entry of entries) {
      const zone = entry?.[attr]
      if (!Array.isArray(zone)) continue

      for (const block of zone) {
        if (block?.__component) {
          components.add(block.__component)
        }
      }
    }

    componentsToPopulate[attr] = [...components]
  }

  return componentsToPopulate
}
