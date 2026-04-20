import type { TransformContext, TransformFn } from "./base.ts"
import { absoluteUrl, extractMediaUrl } from "./convert.ts"

const META_TITLE_MAX = 60
const META_DESCRIPTION_MAX = 160
const OG_SITE_NAME = "Strapi"

type SocialEntry = {
  socialNetwork?: string
  title?: string
  description?: string
  image?: unknown
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 3) + "..." : value
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
   * Default `og.type` value when the component lacks one. Blog posts pass
   * "article"; generic pages/cms entities stay on the implicit "website".
   */
  defaultOgType?: "article" | "website"
}

/**
 * Transform v4 shared.seo component to v5 seo-utilities.seo format.
 *
 * v4: { metaTitle, metaDescription, metaImage, metaSocial[],
 *       keywords, structuredData, canonicalURL, metaRobots, ... }
 * v5: { metaTitle, metaDescription, metaImage, keywords, canonicalUrl,
 *       structuredData, og: { title, description, type, image, siteName, ... },
 *       twitter: { title, description, images, ... } }
 *
 * Fallbacks sourced from the parent entity (`title`, `description`, `content`)
 * guarantee SEO fields are never empty after migration. Media references are
 * re-uploaded to v5 so IDs are valid on the target.
 */
export function createTransformSeo(
  options: TransformSeoOptions = {}
): TransformFn {
  const defaultOgType = options.defaultOgType ?? "website"

  return async (entity, ctx) => {
    const seo = entity["seo"] as Record<string, unknown> | undefined | null

    const entityTitle =
      typeof entity["title"] === "string" ? (entity["title"] as string) : ""
    const entityDescription =
      typeof entity["description"] === "string"
        ? (entity["description"] as string)
        : ""
    const derivedDescription =
      entityDescription || firstParagraph(entity["content"]) || ""

    const src: Record<string, unknown> = seo ? { ...seo } : {}
    delete src["__component"]
    delete src["id"]

    const metaTitle = truncate(
      (src["metaTitle"] as string | undefined) || entityTitle,
      META_TITLE_MAX
    )
    const metaDescription = truncate(
      (src["metaDescription"] as string | undefined) || derivedDescription,
      META_DESCRIPTION_MAX
    )

    const transformed: Record<string, unknown> = {}

    if (metaTitle) transformed["metaTitle"] = metaTitle
    if (metaDescription) transformed["metaDescription"] = metaDescription
    if (src["keywords"]) transformed["keywords"] = src["keywords"]
    if (src["structuredData"])
      transformed["structuredData"] = src["structuredData"]
    if (src["canonicalURL"]) transformed["canonicalUrl"] = src["canonicalURL"]

    const metaImageId = await resolveMediaId(src["metaImage"], ctx)
    if (metaImageId != null) transformed["metaImage"] = metaImageId

    const fb = findSocial(src["metaSocial"], "Facebook")
    const tw = findSocial(src["metaSocial"], "Twitter")
    const fbImageId = fb ? await resolveMediaId(fb.image, ctx) : null
    const twImageId = tw ? await resolveMediaId(tw.image, ctx) : null

    const og: Record<string, unknown> = {
      type: defaultOgType,
      siteName: OG_SITE_NAME,
    }

    if (fb?.title) og["title"] = fb.title
    if (fb?.description) og["description"] = fb.description
    if (fbImageId != null) og["image"] = fbImageId

    if (og["image"] == null && metaImageId != null) og["image"] = metaImageId
    if (!og["title"] && metaTitle) og["title"] = metaTitle
    if (!og["description"] && metaDescription)
      og["description"] = metaDescription

    transformed["og"] = og

    const twitter: Record<string, unknown> = {}
    if (tw?.title) twitter["title"] = tw.title
    if (tw?.description) twitter["description"] = tw.description
    if (twImageId != null) twitter["images"] = [twImageId]

    if (!twitter["title"] && metaTitle) twitter["title"] = metaTitle
    if (!twitter["description"] && metaDescription)
      twitter["description"] = metaDescription
    if (twitter["images"] == null && metaImageId != null) {
      twitter["images"] = [metaImageId]
    }

    transformed["twitter"] = twitter

    return {
      ...entity,
      seo: transformed,
    }
  }
}

/** Generic SEO transform — defaults og.type to "website". */
export const transformSeo: TransformFn = createTransformSeo()

/** Blog-post SEO transform — forces og.type="article". */
export const transformBlogSeo: TransformFn = createTransformSeo({
  defaultOgType: "article",
})
