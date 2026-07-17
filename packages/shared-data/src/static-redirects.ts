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
    source: "/contact-sales-cloud",
    destination: "https://strapi.io/contact-sales",
    permanent: true,
  },
  {
    source: "/content-architecture",
    destination: "https://strapi.io/content-management",
    permanent: true,
  },
  {
    source: "/content-videos",
    destination: "https://www.youtube.com/@Strapi/videos",
    permanent: true,
  },
  {
    source: "/culture",
    destination: "https://handbook.strapi.io/",
    permanent: true,
  },
  {
    source: "/culture-code",
    destination: "https://handbook.strapi.io/",
    permanent: true,
  },
  {
    source: "/discovery",
    destination: "/headless-cms/comparaison",
    permanent: true,
  },
  { source: "/five", destination: "/", permanent: true },
  {
    source: "/integrations",
    destination: "https://community.strapi.io/integrations",
    permanent: true,
  },
  { source: "/launch-week", destination: "/five", permanent: true },
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
    source: "/nuxtnation",
    destination: "https://strapi.io/integrations/nuxtjs-cms",
    permanent: true,
  },
  {
    source: "/oldv4",
    destination: "https://docs-v4.strapi.io/dev-docs/migration-guides",
    permanent: true,
  },
  {
    source: "/open-collective-gift-card-redeemed",
    destination: "/",
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
    source: "/premium-support",
    destination: "https://strapi.io/security",
    permanent: true,
  },
  {
    source: "/resource-center",
    destination: "https://docs.strapi.io",
    permanent: true,
  },
  {
    source: "/security-guide",
    destination: "https://strapi.io/security",
    permanent: true,
  },
  {
    source: "/showcases",
    destination: "https://community.strapi.io/showcases",
    permanent: true,
  },
  {
    source: "/solutions",
    destination: "https://strapi.io/solutions/corporate-website-cms",
    permanent: true,
  },
  {
    source: "/strapi-conf-2021-videos",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-consumer-services-retail-ecommerce-cms",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-financial-services-headless-cms",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-gaming-cms-leaderboards-community-platform",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-it-tech-services-developer-headless-cms",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-marketing-advertising-cms-campaign-management",
    destination: "/",
    permanent: true,
  },
  {
    source: "/strapi-media-companies-content-distribution-cms",
    destination: "/",
    permanent: true,
  },
  { source: "/strapi-recipes", destination: "/", permanent: true },
  {
    source: "/strapi-reseller-agreement",
    destination: "/legal",
    permanent: true,
  },
  {
    source: "/strapi-retail-ecommerce-omnichannel-product-cms",
    destination: "https://strapi.io/solutions/ecommerce-cms",
    permanent: true,
  },
  {
    source: "/strapi-telecommunications-customer-portal-cms",
    destination: "/",
    permanent: true,
  },
  {
    source: "/support",
    destination: "https://support.strapi.io/",
    permanent: true,
  },
  { source: "/thank-you", destination: "/", permanent: true },
  {
    source: "/the-best-headless-cms-for-seo",
    destination: "/for-content-teams",
    permanent: true,
  },
  { source: "/v4", destination: "/v5", permanent: true },
  {
    source: "/video-library",
    destination: "https://www.youtube.com/@Strapi/videos",
    permanent: true,
  },
  { source: "/what-is-headless-cms", destination: "/", permanent: true },
  { source: "/why-strapi", destination: "/", permanent: true },
  {
    source: "/write-for-the-community",
    destination: "/community",
    permanent: true,
  },
  {
    source: "/youtube-creator-highlight",
    destination: "/community",
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
