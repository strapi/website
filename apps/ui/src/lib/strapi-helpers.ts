import type { StrapiImageMedia } from "@/types/api"

/**
 * Function to format Strapi media URLs. There are 2 types of upload:
 * - S3 bucket - in this case, the URL is already correct and starts with https
 * - local upload - in this case, the URL starts with /uploads and we need to add API url prefix
 * (this happens in route handler for Strapi assets)
 *
 * Always returns the client-friendly proxy URL (/api/asset/...) to avoid
 * hydration mismatches when used inside client component boundaries.
 */
export const formatStrapiMediaUrl = (
  imageUrl: string | undefined | null
): string | undefined => {
  if (!imageUrl) {
    return undefined
  }

  if (
    typeof imageUrl === "string" &&
    !imageUrl.startsWith("http") &&
    imageUrl.startsWith("/uploads")
  ) {
    return `/api/asset${imageUrl}`
  }

  // S3 upload or already formatted URL - return as is
  return imageUrl
}

export interface StrapiSrcSet {
  readonly src: string | undefined
  readonly srcSet: string | undefined
  readonly width: number | undefined
  readonly height: number | undefined
}

/**
 * Builds a `srcSet` descriptor from a Strapi media object by combining the
 * responsive format variants (thumbnail/small/medium/large) with the original.
 *
 * Reads widths directly from `media.formats` — Strapi only generates variants
 * when the original is larger than the breakpoint, so missing variants are
 * simply absent from the set (no 404 risk).
 */
export function buildStrapiSrcSet(
  media: StrapiImageMedia | null | undefined
): StrapiSrcSet {
  if (!media) {
    return {
      src: undefined,
      srcSet: undefined,
      width: undefined,
      height: undefined,
    }
  }

  const byWidth = new Map<number, string>()

  for (const format of Object.values(media.formats ?? {})) {
    const url = formatStrapiMediaUrl(format?.url)
    const width = format?.width

    if (url && typeof width === "number" && width > 0 && !byWidth.has(width)) {
      byWidth.set(width, url)
    }
  }

  const originalUrl = formatStrapiMediaUrl(media.url)
  const originalWidth = media.width

  if (
    originalUrl &&
    typeof originalWidth === "number" &&
    originalWidth > 0 &&
    !byWidth.has(originalWidth)
  ) {
    byWidth.set(originalWidth, originalUrl)
  }

  const sorted = [...byWidth.entries()].sort(([a], [b]) => a - b)
  const srcSet =
    sorted.length > 1
      ? sorted.map(([w, url]) => `${url} ${w}w`).join(", ")
      : undefined

  return {
    src: originalUrl,
    srcSet,
    width: media.width,
    height: media.height,
  }
}
