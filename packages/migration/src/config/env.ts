export interface MigrationEnv {
  source: {
    baseUrl: string
    /** CDN host hosting media uploads. Strapi Cloud hosts these on a separate `*.media.strapiapp.com` domain. */
    mediaBaseUrl: string
    token: string
  }
  target: {
    baseUrl: string
    token: string
  }
}

/**
 * Default media CDN for the legacy Strapi Cloud v4 source.
 * Override with SOURCE_MEDIA_URL when running against a different source.
 */
const DEFAULT_SOURCE_MEDIA_URL =
  "https://delicate-dawn-ac25646e6d.media.strapiapp.com"

export function loadEnv(): MigrationEnv {
  const sourceUrl = process.env["SOURCE_URL"]
  const sourceToken = process.env["SOURCE_TOKEN"]
  const sourceMediaUrl = process.env["SOURCE_MEDIA_URL"]
  const targetUrl = process.env["TARGET_URL"]
  const targetToken = process.env["TARGET_TOKEN"]

  if (!sourceUrl || !sourceToken) {
    throw new Error("Missing SOURCE_URL or SOURCE_TOKEN environment variables")
  }

  if (!targetUrl || !targetToken) {
    throw new Error("Missing TARGET_URL or TARGET_TOKEN environment variables")
  }

  return {
    source: {
      baseUrl: sourceUrl.replace(/\/$/, ""),
      mediaBaseUrl: (sourceMediaUrl ?? DEFAULT_SOURCE_MEDIA_URL).replace(
        /\/$/,
        ""
      ),
      token: sourceToken,
    },
    target: {
      baseUrl: targetUrl.replace(/\/$/, ""),
      token: targetToken,
    },
  }
}

/** Module-level cache for `absoluteUrl` so call sites don't have to thread `env` around. */
let _sourceMediaUrl: string | undefined

/**
 * Resolve a (possibly relative) v4 media URL to absolute. Lazy-reads
 * SOURCE_MEDIA_URL on first call. Set explicitly via `setSourceMediaUrl` if
 * `loadEnv` isn't called first.
 */
export function absoluteSourceMediaUrl(url: string): string {
  if (url.startsWith("http")) return url

  _sourceMediaUrl ??= (
    process.env["SOURCE_MEDIA_URL"] ?? DEFAULT_SOURCE_MEDIA_URL
  ).replace(/\/$/, "")

  return `${_sourceMediaUrl}${url}`
}

export function setSourceMediaUrl(url: string): void {
  _sourceMediaUrl = url.replace(/\/$/, "")
}
