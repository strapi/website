import { hashStringSHA256 } from "@/lib/crypto"
import { getEnvVar } from "@/lib/env-vars"

import { StrapiPreviewWindowChangeListener } from "./StrapiPreviewListener"

export async function StrapiPreviewListener() {
  const strapiUrl = getEnvVar("STRAPI_URL")

  if (!strapiUrl) {
    return null
  }

  const previewSecret = Boolean(getEnvVar("STRAPI_PREVIEW_SECRET"))

  /**
   * Hash the normalized origin, not the raw env var — `message.origin` in the
   * client listener never has a trailing slash or path, so hashing a value
   * like "https://cms.example.com/" would silently never match.
   */
  const strapiPreviewHashedOrigin = previewSecret
    ? await hashStringSHA256(new URL(strapiUrl).origin)
    : undefined

  if (!previewSecret || !strapiPreviewHashedOrigin) {
    return null
  }

  return (
    <StrapiPreviewWindowChangeListener
      hashedAllowedReloadOrigin={strapiPreviewHashedOrigin}
    />
  )
}
