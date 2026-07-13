import { normalizePageFullPath } from "@repo/shared-data"

type RevalidateParams = {
  uid: string
  fullPaths?: string[]
  locale?: string
  tags?: string[]
}

const REVALIDATE_REQUEST_TIMEOUT_MS = 8000

export default () => ({
  async run({ uid, fullPaths = [], locale, tags = [] }: RevalidateParams) {
    const clientUrl = process.env.CLIENT_URL
    const secret = process.env.STRAPI_REVALIDATE_SECRET

    if (!clientUrl || !secret) {
      throw new Error(
        "Revalidation configuration missing. Ensure CLIENT_URL and STRAPI_REVALIDATE_SECRET are set."
      )
    }

    /**
     * Drop the Strapi-side REST cache BEFORE notifying the frontend — the
     * re-render triggered by the webhook fetches through this cache, and a
     * stale entry (1h TTL) would be baked into the "fresh" HTML and then
     * re-cached by CloudFront. The plugin registers the service as
     * "cacheStore" (there is no "cache" service); no optional chaining so
     * a missing plugin/service lands in the catch instead of no-oping.
     */
    try {
      await strapi.plugin("rest-cache").service("cacheStore").reset()
    } catch (error) {
      strapi.log.error(
        `[revalidate.run] rest-cache reset failed — frontend re-renders may bake stale REST cache entries into cached HTML: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    const normalizedFullPaths = [
      ...new Set(
        fullPaths
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
          .map((path) => normalizePageFullPath([path], locale))
      ),
    ]

    const normalizedTags = tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const deduplicatedTags = [...new Set([`strapi:${uid}`, ...normalizedTags])]

    const payload = {
      uid,
      secret,
      tags: deduplicatedTags,
      fullPaths:
        normalizedFullPaths.length > 0 ? normalizedFullPaths : undefined,
    }

    let response: Response
    try {
      response = await fetch(`${clientUrl}/api/strapi-revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REVALIDATE_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      const isTimeout =
        error instanceof DOMException && error.name === "TimeoutError"
      strapi.log.error(
        `[revalidate.run] ${isTimeout ? "Timed out" : "Network error"} calling frontend for "${uid}" "${payload.fullPaths?.join(",") ?? "-"}": ${error instanceof Error ? error.message : String(error)}`
      )
      throw new Error("Failed to revalidate frontend cache.")
    }

    if (!response.ok) {
      const message = await response.text()
      strapi.log.error(
        `[revalidate.run] Revalidation request failed (${response.status}) for "${uid}" "${payload.fullPaths?.join(",") ?? "-"}": ${message}`
      )
      throw new Error("Failed to revalidate frontend cache.")
    }

    const result = (await response.json()) as { cdnPurged?: boolean }

    if (result?.cdnPurged === false) {
      strapi.log.warn(
        `[revalidate.run] Frontend cache revalidated for "${uid}" but the CDN purge did not run — check CLOUDFRONT_WEBSITE_DISTRIBUTION_ID and AWS credentials on the frontend deployment.`
      )
    }

    return result
  },
})
