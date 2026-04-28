import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  // TODO: REMOVE BEFORE PRODUCTION DEPLOY — temporary site-wide noindex while
  // hosted on a non-production URL. Revert this file to its prior version
  // (env-aware allow + sitemap) — see git history.
  return { rules: { userAgent: "*", disallow: "/" } }
}
