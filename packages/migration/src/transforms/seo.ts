import type { TransformFn } from "./base.ts"

/**
 * Transform v4 shared.seo component to v5 seo-utilities.seo format.
 * v4: { seo: { metaTitle, metaDescription, metaImage, keywords, structuredData, canonicalURL } }
 * v5: { seo: { metaTitle, metaDescription, metaImage (media), keywords, canonicalUrl, structuredData } }
 */
export const transformSeo: TransformFn = (entity) => {
  const seo = entity["seo"] as Record<string, unknown> | undefined | null

  if (!seo) return entity

  const { __component: _, id: __, ...seoFields } = seo

  const transformed: Record<string, unknown> = {}

  if (seoFields["metaTitle"]) {
    const title = String(seoFields["metaTitle"])
    transformed["metaTitle"] =
      title.length > 60 ? title.slice(0, 57) + "..." : title
  }
  if (seoFields["metaDescription"]) {
    const desc = String(seoFields["metaDescription"])
    transformed["metaDescription"] =
      desc.length > 160 ? desc.slice(0, 157) + "..." : desc
  }
  if (seoFields["keywords"]) transformed["keywords"] = seoFields["keywords"]
  if (seoFields["structuredData"])
    transformed["structuredData"] = seoFields["structuredData"]

  // v4 canonicalURL → v5 canonicalUrl (lowercase u)
  if (seoFields["canonicalURL"]) {
    transformed["canonicalUrl"] = seoFields["canonicalURL"]
  }

  // v4 metaImage is a media relation — pass through for media rewrite
  // v5 expects metaImage as media field (not ogImage)
  if (seoFields["metaImage"]) {
    transformed["metaImage"] = seoFields["metaImage"]
  }

  return {
    ...entity,
    seo: transformed,
  }
}
