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
