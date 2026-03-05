import type { TransformFn, TransformContext } from "./base.ts"

/**
 * Walk the entity tree, find basic-image objects with `fallbackSrc`,
 * download the image from the CDN, upload to v5 media library,
 * and replace with a proper media relation.
 *
 * Uses MediaCache to avoid re-uploading the same image.
 * In dry-run mode, skips actual uploads.
 */
export const uploadMedia: TransformFn = async (entity, ctx) => {
  return (await processNode(entity, ctx)) as Record<string, unknown>
}

async function processNode(
  obj: unknown,
  ctx: TransformContext
): Promise<unknown> {
  if (Array.isArray(obj)) {
    const results = []
    for (const item of obj) {
      results.push(await processNode(item, ctx))
    }

    return results
  }

  if (obj !== null && typeof obj === "object") {
    const record = obj as Record<string, unknown>

    // Detect basic-image shape: has fallbackSrc and no media
    if (isBasicImageWithFallback(record)) {
      return uploadAndLink(record, ctx)
    }

    // Also strip any remaining raw v4 media objects
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(record)) {
      if (isV4MediaField(value) || isV4MediaObject(value)) {
        result[key] = null
        continue
      }

      result[key] = await processNode(value, ctx)
    }

    return result
  }

  return obj
}

/** Check if this looks like a basic-image component with fallbackSrc but no uploaded media */
function isBasicImageWithFallback(obj: Record<string, unknown>): boolean {
  return (
    typeof obj["fallbackSrc"] === "string" &&
    obj["fallbackSrc"] !== "" &&
    !obj["media"]
  )
}

/** Download from fallbackSrc, upload to v5, set media ID */
async function uploadAndLink(
  basicImage: Record<string, unknown>,
  ctx: TransformContext
): Promise<Record<string, unknown>> {
  const fallbackSrc = basicImage["fallbackSrc"] as string

  // Check cache first
  const cachedId = ctx.mediaCache.get(fallbackSrc)

  if (cachedId) {
    ctx.logger.debug(`Media cache hit: ${fallbackSrc} → ${cachedId}`)

    return { ...basicImage, media: cachedId }
  }

  // In dry-run mode, skip actual upload
  if (ctx.dryRun) {
    ctx.logger.debug(`DRY: would upload ${fallbackSrc}`)

    return basicImage
  }

  const mediaId = await ctx.targetClient.uploadMedia(fallbackSrc)

  if (!mediaId) {
    ctx.logger.warn(
      `Failed to upload media, keeping fallbackSrc: ${fallbackSrc}`
    )

    return basicImage
  }

  ctx.mediaCache.set(fallbackSrc, mediaId)

  // Periodically save cache
  if (ctx.mediaCache.size % 20 === 0) {
    await ctx.mediaCache.save()
  }

  ctx.logger.debug(`Uploaded media: ${fallbackSrc} → ${mediaId}`)

  return { ...basicImage, media: mediaId }
}

/** Check if value is a v4 media relation: { data: { id, attributes: { url } } } */
function isV4MediaField(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>

  if (!v["data"] || typeof v["data"] !== "object") return false
  const data = v["data"] as Record<string, unknown>

  if (data["attributes"] && typeof data["attributes"] === "object") {
    const attrs = data["attributes"] as Record<string, unknown>

    return typeof attrs["url"] === "string"
  }

  return false
}

/** Check if value is a direct media object with url and hash/width */
function isV4MediaObject(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>

  return (
    typeof v["url"] === "string" &&
    (typeof v["hash"] === "string" || typeof v["mime"] === "string")
  )
}
