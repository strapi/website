import type { TransformContext, TransformFn } from "./base.ts"
import { absoluteUrl, extractMediaUrl } from "./convert.ts"

const META_TITLE_MAX = 60
const META_DESCRIPTION_MIN = 50
const META_DESCRIPTION_MAX = 160
const META_SOCIAL_TITLE_MAX = 60
const META_SOCIAL_DESCRIPTION_MAX = 65

type SocialEntry = {
  socialNetwork?: string
  title?: string
  description?: string
  image?: unknown
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 3) + "..." : value
}

function buildFallbackDescription(title: string): string {
  const topic = title.trim()

  if (topic) {
    return `Learn more about ${topic} with tutorials, guides, and resources on the Strapi blog.`
  }

  return "Learn more with tutorials, guides, and resources on the Strapi blog."
}

/**
 * Pad a string up to `min` chars by appending additional snippets. Used to
 * satisfy the target schema's metaDescription minLength while respecting max.
 */
function ensureMinLength(
  value: string,
  min: number,
  max: number,
  additions: string[],
  fallbackTitle: string
): string {
  let out = value.trim()
  if (out.length >= min) return out

  for (const add of additions) {
    if (!add) continue

    const extra = add.trim()
    if (!extra || out.includes(extra)) continue

    out = out ? `${out} — ${extra}` : extra
    if (out.length >= min) break
  }

  if (out.length < min) {
    out = buildFallbackDescription(fallbackTitle)
  }

  return truncate(out, max)
}

function stripMarkdown(value: string): string {
  return value
    .replaceAll(/!\[[^\]]*]\([^)]*\)/g, "")
    .replaceAll(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replaceAll(/[`*_>#-]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
}

function firstParagraph(content: unknown): string | undefined {
  if (typeof content !== "string") return undefined

  const plain = stripMarkdown(content)
  if (!plain) return undefined

  const paragraph = plain.split(/\n{2,}/).find((p) => p.trim().length > 0)

  return paragraph?.trim()
}

function findSocial(
  metaSocial: unknown,
  network: string
): SocialEntry | undefined {
  if (!Array.isArray(metaSocial)) return undefined

  return (metaSocial as SocialEntry[]).find(
    (entry) =>
      typeof entry?.socialNetwork === "string" &&
      entry.socialNetwork.toLowerCase() === network.toLowerCase()
  )
}

/**
 * Resolve a v4 media reference to a v5 media ID by extracting its URL,
 * uploading to v5 (cached), and returning the new ID. Returns `null` when
 * the source shape doesn't have a URL or upload fails.
 */
async function resolveMediaId(
  value: unknown,
  ctx: TransformContext
): Promise<number | null> {
  if (value == null) return null

  const info = extractMediaUrl(value)
  if (!info?.url) return null

  const url = absoluteUrl(info.url)

  if (ctx.dryRun) {
    ctx.logger.debug(`DRY: would upload SEO media ${url}`)

    return null
  }

  const cached = ctx.mediaCache.get(url)
  if (cached?.id) return cached.id

  const uploaded = await ctx.targetClient.uploadMedia(url)
  if (!uploaded) {
    ctx.logger.warn(`Failed to upload SEO media: ${url}`)

    return null
  }

  ctx.mediaCache.set(url, uploaded)

  return uploaded.id
}

interface TransformSeoOptions {
  /**
   * Retained for backwards compatibility — the plugin-canonical shared.seo
   * schema no longer exposes an og.type field.
   */
  defaultOgType?: "article" | "website"
}

/**
 * Transform v4 shared.seo to the plugin-canonical v5 shared.seo shape.
 *
 * v4: { metaTitle, metaDescription, metaImage, metaSocial[],
 *       keywords, structuredData, canonicalURL, metaRobots, ... }
 * v5: { metaTitle, metaDescription, metaImage, keywords, metaRobots,
 *       canonicalURL, structuredData,
 *       metaSocial: [{ socialNetwork, title, description, image }] }
 *
 * Fallbacks sourced from the parent entity (`title`, `description`, `content`)
 * guarantee SEO fields are never empty after migration. Media references are
 * re-uploaded to v5 so IDs are valid on the target.
 */
export function createTransformSeo(
  _options: TransformSeoOptions = {}
): TransformFn {
  return async (entity, ctx) => {
    const seo = entity["seo"] as Record<string, unknown> | undefined | null

    const entityTitle =
      (typeof entity["title"] === "string" && (entity["title"] as string)) ||
      (typeof entity["name"] === "string" && (entity["name"] as string)) ||
      ""
    const entityDescription =
      typeof entity["description"] === "string"
        ? (entity["description"] as string)
        : ""
    const firstPara = firstParagraph(entity["content"]) || ""
    const derivedDescription = entityDescription || firstPara

    const src: Record<string, unknown> = seo ? { ...seo } : {}
    delete src["__component"]
    delete src["id"]

    const metaTitle = truncate(
      (src["metaTitle"] as string | undefined) || entityTitle,
      META_TITLE_MAX
    )
    const metaDescription = ensureMinLength(
      truncate(
        (src["metaDescription"] as string | undefined) || derivedDescription,
        META_DESCRIPTION_MAX
      ),
      META_DESCRIPTION_MIN,
      META_DESCRIPTION_MAX,
      [entityDescription, firstPara, entityTitle],
      entityTitle
    )

    const transformed: Record<string, unknown> = {}

    if (metaTitle) transformed["metaTitle"] = metaTitle
    if (metaDescription) transformed["metaDescription"] = metaDescription
    if (src["keywords"]) transformed["keywords"] = src["keywords"]
    if (src["metaRobots"]) transformed["metaRobots"] = src["metaRobots"]
    if (src["structuredData"])
      transformed["structuredData"] = src["structuredData"]
    if (src["canonicalURL"]) transformed["canonicalURL"] = src["canonicalURL"]

    const metaImageId = await resolveMediaId(src["metaImage"], ctx)
    if (metaImageId != null) transformed["metaImage"] = metaImageId

    const fb = findSocial(src["metaSocial"], "Facebook")
    const tw = findSocial(src["metaSocial"], "Twitter")
    const fbImageId = fb ? await resolveMediaId(fb.image, ctx) : null
    const twImageId = tw ? await resolveMediaId(tw.image, ctx) : null

    const metaSocial = [
      buildMetaSocial(
        "Facebook",
        fb,
        fbImageId,
        metaImageId,
        metaTitle,
        metaDescription
      ),
      buildMetaSocial(
        "Twitter",
        tw,
        twImageId,
        metaImageId,
        metaTitle,
        metaDescription
      ),
    ].filter((entry): entry is Record<string, unknown> => entry != null)

    if (metaSocial.length > 0) transformed["metaSocial"] = metaSocial

    return {
      ...entity,
      seo: transformed,
    }
  }
}

function buildMetaSocial(
  socialNetwork: "Facebook" | "Twitter",
  src: SocialEntry | undefined,
  srcImageId: number | null,
  fallbackImageId: number | null,
  fallbackTitle: string,
  fallbackDescription: string
): Record<string, unknown> | null {
  const title = truncate(src?.title || fallbackTitle, META_SOCIAL_TITLE_MAX)
  const description = truncate(
    src?.description || fallbackDescription,
    META_SOCIAL_DESCRIPTION_MAX
  )

  if (!title || !description) return null

  const entry: Record<string, unknown> = {
    socialNetwork,
    title,
    description,
  }

  const imageId = srcImageId ?? fallbackImageId
  if (imageId != null) entry["image"] = imageId

  return entry
}

/** Generic SEO transform. */
export const transformSeo: TransformFn = createTransformSeo()

/** Blog-post SEO transform (option retained for API stability). */
export const transformBlogSeo: TransformFn = createTransformSeo({
  defaultOgType: "article",
})
