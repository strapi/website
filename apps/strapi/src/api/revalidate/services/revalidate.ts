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

    // Drop the Strapi-side REST cache so the next frontend fetch can't read
    // a stale entry that races the revalidate POST below.
    try {
      await strapi.plugin("rest-cache")?.service("cache")?.reset()
    } catch (error) {
      strapi.log.warn(
        `[revalidate.run] rest-cache reset failed: ${error instanceof Error ? error.message : String(error)}`
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

    return response.json()
  },
})
