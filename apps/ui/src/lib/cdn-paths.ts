/**
 * Pure resolution of a Strapi revalidation payload into CloudFront
 * invalidation paths. Kept free of `env.mjs`/`navigation` imports so it can
 * be unit-tested; the SDK wiring lives in `lib/cdn.ts`.
 *
 * Explicit page paths are invalidated as-is. Cache tags have no CloudFront
 * equivalent, so they are translated via `TAG_PATH_PREFIXES` into wildcard
 * path invalidations (e.g. blog tags -> `/blog*`); tags without a known
 * path scope (header/footer/global, pages embedded anywhere) escalate to a
 * full `/*` purge. A wildcard counts as a single billable path, so the
 * escalation is cheap — it just resets the whole distribution cache.
 */

const WILDCARD = "/*"

/**
 * CloudFront hard limits: 3000 in-progress invalidation paths and 15
 * in-progress wildcard paths per distribution. Anything larger collapses
 * to a single `/*` purge, which is both cheaper and always correct.
 */
const MAX_INVALIDATION_PATHS = 3000
const MAX_WILDCARD_PATHS = 15

/**
 * Maps `strapi:<uid>` cache tags (see `apps/strapi/src/revalidate/config.ts`
 * and `STRAPI_TAGS` in `lib/strapi-api/content/server.ts`) to the URL
 * subtree(s) where that content can render. Tags missing from this map are
 * treated as site-wide and trigger a `/*` purge.
 */
const TAG_PATH_PREFIXES: Record<string, string[]> = {
  "strapi:api::blog.blog": ["/blog"],
  "strapi:api::blog-post.blog-post": ["/blog"],
  "strapi:api::post-category.post-category": ["/blog"],
  "strapi:api::post-tag.post-tag": ["/blog"],
  "strapi:api::case-study.case-study": ["/user-stories"],
  "strapi:api::cms.cms": ["/headless-cms"],
  "strapi:api::cms-comparison.cms-comparison": ["/headless-cms"],
}

export type PurgeCDNCacheInput = {
  uid: string
  paths: string[]
  tags: string[]
}

/**
 * Resolves the revalidation payload into the list of CloudFront
 * invalidation paths.
 *
 * The publishing type's own `strapi:<uid>` tag is skipped when explicit
 * paths are present and the tag has no listing scope of its own — the paths
 * already cover the change, and escalating every page publish to `/*`
 * would defeat per-path invalidation.
 */
export function resolveCDNInvalidationPaths(
  input: PurgeCDNCacheInput,
  locales: readonly string[]
): string[] {
  const items = new Set<string>()
  const wildcardPrefixes: string[] = []

  for (const tag of input.tags) {
    const prefixes = TAG_PATH_PREFIXES[tag]

    if (prefixes) {
      for (const prefix of prefixes) {
        wildcardPrefixes.push(prefix, ...locales.map((l) => `/${l}${prefix}`))
      }

      continue
    }

    if (tag === `strapi:${input.uid}` && input.paths.length > 0) {
      continue
    }

    return [WILDCARD]
  }

  for (const prefix of wildcardPrefixes) {
    items.add(`${prefix}*`)
  }

  for (const path of input.paths) {
    const coveredByWildcard = wildcardPrefixes.some((prefix) =>
      path.startsWith(prefix)
    )

    if (!coveredByWildcard) {
      items.add(path)
    }
  }

  if (items.size === 0) {
    return []
  }

  const wildcardCount = [...items].filter((item) => item.includes("*")).length

  if (
    items.size > MAX_INVALIDATION_PATHS ||
    wildcardCount > MAX_WILDCARD_PATHS
  ) {
    return [WILDCARD]
  }

  return [...items]
}
