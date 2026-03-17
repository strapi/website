import type { TransformFn } from "./base.ts"

/** Generate a URL-safe slug from a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
}

/** Ensure entity has a slug field, generating from sourceField if missing */
export function ensureSlug(sourceField = "name"): TransformFn {
  return (entity) => {
    if (
      entity["slug"] &&
      typeof entity["slug"] === "string" &&
      entity["slug"].length > 0
    ) {
      return entity
    }

    const source = entity[sourceField]

    if (typeof source === "string" && source.length > 0) {
      return { ...entity, slug: slugify(source) }
    }

    return entity
  }
}

const MEDIA_CDN = "https://delicate-dawn-ac25646e6d.media.strapiapp.com"

function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `${MEDIA_CDN}${url}`
}

/** Extract URL + metadata from various v4 media formats */
export function extractMediaUrl(media: unknown):
  | {
      url: string
      alt?: string
      width?: number
      height?: number
    }
  | undefined {
  if (!media || typeof media !== "object") return undefined
  const m = media as Record<string, unknown>

  // Direct URL (already flat)
  if (typeof m["url"] === "string") {
    return {
      url: m["url"] as string,
      alt: m["alternativeText"] as string,
      width: m["width"] as number,
      height: m["height"] as number,
    }
  }

  // v4 nested: { data: { id, attributes: { url, ... } } }
  if (m["data"] && typeof m["data"] === "object") {
    const data = m["data"] as Record<string, unknown>

    if (data["attributes"] && typeof data["attributes"] === "object") {
      const attrs = data["attributes"] as Record<string, unknown>

      if (typeof attrs["url"] === "string") {
        return {
          url: attrs["url"] as string,
          alt: attrs["alternativeText"] as string,
          width: attrs["width"] as number,
          height: attrs["height"] as number,
        }
      }
    }

    if (typeof data["url"] === "string") {
      return {
        url: data["url"] as string,
        alt: data["alternativeText"] as string,
        width: data["width"] as number,
        height: data["height"] as number,
      }
    }
  }

  return undefined
}

/**
 * Convert a v4 media.image component → v5 media.image format.
 * v4: { media: { data: { attributes: { url, ... } } }, href, width, height }
 * v5: { image: { alt, width, height, fallbackSrc }, alignment }
 */
export function convertV4MediaImage(
  v4Component: unknown
): Record<string, unknown> | null {
  if (!v4Component || typeof v4Component !== "object") return null
  const comp = v4Component as Record<string, unknown>

  const mediaInfo = extractMediaUrl(comp["media"])
  if (!mediaInfo) return null

  return {
    image: {
      alt: mediaInfo.alt ?? "",
      width: mediaInfo.width ?? null,
      height: mediaInfo.height ?? null,
      fallbackSrc: absoluteUrl(mediaInfo.url),
    },
    alignment: "center",
  }
}

/**
 * Convert v4 links.link → v5 utilities.link.
 * v4: { href, target, text, summary, icons[] }
 * v5: { type, label, newTab, href }
 */
export function convertV4Link(v4Link: unknown): Record<string, unknown> | null {
  if (!v4Link || typeof v4Link !== "object") return null
  const link = v4Link as Record<string, unknown>

  const href = (link["href"] as string) ?? (link["url"] as string) ?? ""
  if (!href) return null

  return {
    type: "external",
    label: (link["text"] as string) ?? (link["label"] as string) ?? "",
    newTab: link["target"] === "_blank",
    href,
  }
}

/**
 * Extract author fields from v4 shared.person component.
 * v4: { name, description, image (media.image), companyLogo (media.image) }
 */
export function extractV4Person(person: unknown): {
  authorName: string
  authorRole: string
  avatarUrl: string | null
  logoUrl: string | null
} {
  if (!person || typeof person !== "object") {
    return { authorName: "", authorRole: "", avatarUrl: null, logoUrl: null }
  }

  const p = person as Record<string, unknown>

  // Extract avatar URL from person.image (media.image component)
  let avatarUrl: string | null = null
  const imageComp = p["image"] as Record<string, unknown> | undefined
  if (imageComp) {
    const imageMedia = extractMediaUrl(imageComp["media"] ?? imageComp)
    if (imageMedia) {
      avatarUrl = absoluteUrl(imageMedia.url)
    }
  }

  // Extract company logo URL
  let logoUrl: string | null = null
  const logoComp = p["companyLogo"] as Record<string, unknown> | undefined
  if (logoComp) {
    const logoMedia = extractMediaUrl(logoComp["media"] ?? logoComp)
    if (logoMedia) {
      logoUrl = absoluteUrl(logoMedia.url)
    }
  }

  return {
    authorName: (p["name"] as string) ?? "",
    authorRole: (p["description"] as string) ?? "",
    avatarUrl,
    logoUrl,
  }
}

/**
 * Convert v4 text.text-and-boolean[] → v5 cms.field-entry[].
 * Fields: name, category, text, mark (identical structure)
 */
export function convertV4FieldEntries(
  v4Fields: unknown
): Record<string, unknown>[] {
  if (!Array.isArray(v4Fields)) return []

  return v4Fields.map((field) => {
    if (!field || typeof field !== "object") return { name: "" }
    const f = field as Record<string, unknown>

    return {
      name: (f["name"] as string) ?? "",
      category: (f["category"] as string) ?? "",
      text: (f["text"] as string) ?? "",
      mark: (f["mark"] as boolean) ?? false,
    }
  })
}

/**
 * Upload direct media fields (v4 media relation → v5 media ID).
 * For fields like CMS.logo where v5 expects a direct media ID.
 */
export function uploadDirectMediaFields(...fields: string[]): TransformFn {
  return async (entity, ctx) => {
    const result = { ...entity }

    for (const field of fields) {
      const value = result[field]
      if (!value || typeof value !== "object") continue

      const mediaInfo = extractMediaUrl(value)
      if (!mediaInfo) {
        result[field] = null
        continue
      }

      const url = absoluteUrl(mediaInfo.url)

      if (ctx.dryRun) {
        ctx.logger.debug(`DRY: would upload direct media ${field}: ${url}`)
        result[field] = null
        continue
      }

      const cachedId = ctx.mediaCache.get(url)
      if (cachedId) {
        result[field] = cachedId
        continue
      }

      const mediaId = await ctx.targetClient.uploadMedia(url)

      if (mediaId) {
        ctx.mediaCache.set(url, mediaId)
        result[field] = mediaId
      } else {
        ctx.logger.warn(`Failed to upload direct media ${field}: ${url}`)
        result[field] = null
      }
    }

    return result
  }
}

/**
 * Convert v4 media.image component fields to v5 format with fallbackSrc.
 * Must run BEFORE uploadMedia so the fallbackSrc gets processed.
 */
export function convertMediaImageFields(...fields: string[]): TransformFn {
  return (entity) => {
    const result = { ...entity }

    for (const field of fields) {
      const value = result[field]
      if (!value) continue

      result[field] = convertV4MediaImage(value)
    }

    return result
  }
}

/**
 * Convert v4 links.link component fields to v5 utilities.link format.
 */
export function convertLinkFields(...fields: string[]): TransformFn {
  return (entity) => {
    const result = { ...entity }

    for (const field of fields) {
      const value = result[field]
      if (!value) continue

      result[field] = convertV4Link(value)
    }

    return result
  }
}

/**
 * Extract nested v4 relation from a component field.
 * Used for things like location.cities where the relation
 * is nested inside a component and not flattened by flattenV4.
 *
 * Returns the first v4 relation ID found.
 */
export function extractNestedRelationId(
  component: unknown,
  field: string
): number | null {
  if (!component || typeof component !== "object") return null
  const comp = component as Record<string, unknown>
  const relation = comp[field]

  if (!relation || typeof relation !== "object") return null
  const rel = relation as Record<string, unknown>

  // v4 array relation: { data: [{ id, attributes }] }
  if (Array.isArray(rel["data"])) {
    const first = (rel["data"] as Record<string, unknown>[])[0]
    if (first && typeof first["id"] === "number") {
      return first["id"]
    }
  }

  // v4 single relation: { data: { id, attributes } }
  if (rel["data"] && typeof rel["data"] === "object") {
    const data = rel["data"] as Record<string, unknown>
    if (typeof data["id"] === "number") {
      return data["id"]
    }
  }

  // Already flattened (has _v4Id)
  if (typeof rel["_v4Id"] === "number") {
    return rel["_v4Id"]
  }

  // Array of flattened relations
  if (Array.isArray(relation)) {
    const first = (relation as Record<string, unknown>[])[0]
    if (first && typeof first["_v4Id"] === "number") {
      return first["_v4Id"]
    }
  }

  return null
}

/**
 * Extract array of v4 relation IDs from a flattened relation field.
 * After flattenV4, array relations become [{ _v4Id, ...attributes }].
 */
export function extractRelationIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>)["_v4Id"] === "number"
    )
    .map((item) => (item as Record<string, unknown>)["_v4Id"] as number)
}

/**
 * Convert v4 media.image component → v5 utilities.basic-image format.
 * v4: { media: { data: { attributes: { url, alternativeText, width, height } } } }
 * v5: { fallbackSrc, alt, width, height } (uploadMedia will replace fallbackSrc → media ID)
 */
export function convertV4BasicImage(
  v4Media: unknown
): Record<string, unknown> | null {
  if (!v4Media || typeof v4Media !== "object") return null
  const m = v4Media as Record<string, unknown>

  // Try extracting from media.image component (has nested .media field)
  const mediaInfo = extractMediaUrl(m["media"] ?? m)
  if (!mediaInfo) return null

  return {
    fallbackSrc: absoluteUrl(mediaInfo.url),
    alt: mediaInfo.alt ?? "",
    width: mediaInfo.width ?? null,
    height: mediaInfo.height ?? null,
  }
}

/**
 * Convert v4 links.link → v5 utilities.link-text format.
 * v4: { href, target, text, summary }
 * v5: { type, label, newTab, href }
 */
export function convertV4LinkText(
  v4Link: unknown
): Record<string, unknown> | null {
  if (!v4Link || typeof v4Link !== "object") return null
  const link = v4Link as Record<string, unknown>

  const href = (link["href"] as string) ?? (link["url"] as string) ?? ""
  if (!href) return null

  return {
    type: "external",
    label: (link["text"] as string) ?? (link["label"] as string) ?? "",
    newTab: link["target"] === "_blank",
    href,
  }
}

/**
 * Convert v4 links.link → v5 utilities.link-image format.
 * v4: { href, target, text, summary, icons: media.image[] }
 * v5: { type, label, newTab, href, image: basic-image }
 */
export function convertV4LinkImage(
  v4Link: unknown
): Record<string, unknown> | null {
  if (!v4Link || typeof v4Link !== "object") return null
  const link = v4Link as Record<string, unknown>

  const href = (link["href"] as string) ?? (link["url"] as string) ?? ""

  const icons = link["icons"] as Record<string, unknown>[] | undefined
  let image: Record<string, unknown> | null = null

  if (Array.isArray(icons) && icons.length > 0) {
    image = convertV4BasicImage(icons[0])
  }

  return {
    type: "external",
    label: (link["text"] as string) ?? (link["label"] as string) ?? "",
    newTab: link["target"] === "_blank",
    href: href || "/",
    image,
  }
}
