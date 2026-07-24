export interface StaticRedirect {
  source: string
  destination: string
  permanent: boolean
}

/**
 * Build-time redirect table shared by `next.config.mjs` (served as real HTTP
 * redirects) and the frontend link components (resolved at render time via
 * `resolveStaticRedirectDestination` so rendered links point straight at the
 * final destination — prefetching a link whose path redirects to another
 * origin fails with a CORS error in the browser console).
 *
 * Order matters: first match wins, mirroring Next.js behavior. Keep wildcard
 * rules last. Only two source shapes are supported by the resolver below:
 * exact paths and trailing `/:param*` wildcards.
 *
 * Admin-managed redirects (the Strapi `redirect` collection) are intentionally
 * NOT part of this table — they are applied at request time in the proxy so
 * editor changes take effect without a rebuild.
 */
export const STATIC_REDIRECTS: StaticRedirect[] = [
  {
    source: "/community-stars",
    destination:
      "https://community.strapi.io/members?members:createdAt:desc[toggle][community_star]=true",
    permanent: true,
  },
  {
    source: "/integrations",
    destination: "https://community.strapi.io/integrations",
    permanent: true,
  },
  {
    source: "/legacy-community-stars",
    destination:
      "https://community.strapi.io/members?members:createdAt:desc[toggle][community_star]=true",
    permanent: true,
  },
  {
    source: "/market-guidelines",
    destination: "https://community.strapi.io/market-guidelines",
    permanent: true,
  },
  {
    source: "/partners",
    destination: "https://community.strapi.io/partners",
    permanent: true,
  },
  {
    source: "/plugin-resources",
    destination: "https://community.strapi.io/",
    permanent: true,
  },
  {
    source: "/showcases",
    destination: "https://community.strapi.io/showcases",
    permanent: true,
  },

  // Wildcard rules - keep last
  {
    source: "/integrations/:page*",
    destination: "https://community.strapi.io/integrations/:page*",
    permanent: true,
  },
  {
    source: "/partners/:page*",
    destination: "https://community.strapi.io/:page*",
    permanent: true,
  },
  {
    source: "/showcases/:page*",
    destination: "https://community.strapi.io/showcases",
    permanent: true,
  },
]

const WILDCARD_SOURCE_REGEX = /^(.*)\/:\w+\*$/
const WILDCARD_PARAM_REGEX = /:\w+\*/g
const MAX_REDIRECT_CHAIN = 10

/**
 * Returns the final redirect destination for a pathname, or null when no rule
 * matches. Relative destinations are re-resolved so chains collapse to their
 * end (e.g. `/launch-week` -> `/five` -> `/`), matching what a browser would
 * end up at after following each HTTP redirect hop.
 */
export function resolveStaticRedirectDestination(
  pathname: string
): string | null {
  let current = normalizeTrailingSlash(pathname)
  let resolved: string | null = null

  for (let hop = 0; hop < MAX_REDIRECT_CHAIN; hop++) {
    const destination = matchStaticRedirect(current)

    if (destination === null || destination === current) {
      break
    }

    resolved = destination

    if (!destination.startsWith("/")) {
      // Absolute destination -> leaves this app, chain ends here.
      break
    }

    current = normalizeTrailingSlash(destination)
  }

  return resolved
}

function matchStaticRedirect(pathname: string): string | null {
  for (const { source, destination } of STATIC_REDIRECTS) {
    const wildcard = WILDCARD_SOURCE_REGEX.exec(source)

    if (!wildcard) {
      if (pathname === source) {
        return destination
      }
      continue
    }

    const prefix = wildcard[1]!

    if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
      continue
    }

    const rest = pathname.slice(prefix.length + 1)

    return normalizeTrailingSlash(
      destination.replaceAll(WILDCARD_PARAM_REGEX, rest)
    )
  }

  return null
}

function normalizeTrailingSlash(path: string) {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
}
