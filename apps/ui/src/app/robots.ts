import type { MetadataRoute } from "next"

import { getEnvVar } from "@/lib/env-vars"
import { isProduction } from "@/lib/general-helpers"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getEnvVar("APP_PUBLIC_URL")

  if (!isProduction()) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    // `/dev/` (not `/dev`) so prefix matching can't catch unrelated routes
    rules: { userAgent: "*", allow: "/", disallow: "/dev/" },
    ...(baseUrl
      ? { sitemap: new URL("./sitemap.xml", baseUrl).toString() }
      : {}),
  }
}
