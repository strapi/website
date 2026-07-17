import { type NextRequest, NextResponse } from "next/server"
import type { Locale } from "next-intl"

import { routing } from "@/lib/navigation"

const dynamicPrefix = "dynamic"

/**
 * Top-level segments owned by dedicated app routes. These are not served by
 * the /[locale]/dynamic/[[...rest]] Strapi-page route — rewriting them there
 * 404s (e.g. blog posts opened from HubSpot emails with _hsenc/_hsmi params).
 * `user` hosts the blog author pages (/user/[slug]).
 * `order-confirmation` and `get-license` are entirely query-param driven
 * (checkout/email links), so they must keep their own routes — rewriting
 * them to /dynamic 404s every visit.
 */
const dedicatedRouteSegments = new Set([
  "blog",
  "dev",
  "get-license",
  "headless-cms",
  "order-confirmation",
  "user",
  "user-stories",
])

/**
 * Rewrites requests with search params to the /dynamic/ route segment,
 * enabling dynamic rendering for pages that need access to searchParams.
 * Only applies to paths served by the [[...rest]] Strapi-page catch-all;
 * dedicated routes (blog, user-stories, ...) are left untouched.
 * Also blocks direct access to the bare /dynamic path.
 * Returns null if no rewrite is needed.
 */
export const dynamicRewrite = (
  req: NextRequest,
  intlProxy: (req: NextRequest) => NextResponse
): NextResponse | null => {
  const { pathname, search } = req.nextUrl

  const dynamicPathRegex = new RegExp(
    `^/(?:${routing.locales.join("|")}/)?${dynamicPrefix}$`
  )
  if (dynamicPathRegex.test(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", req.url))
  }

  if (!search) {
    return null
  }

  const parts = pathname.split("/").filter(Boolean)

  const hasLocale =
    parts.length >= 1 && routing.locales.includes(parts[0] as Locale)
  const locale = hasLocale ? parts[0] : routing.defaultLocale
  const restParts = parts.slice(hasLocale ? 1 : 0)
  const rest = restParts.join("/")

  if (restParts[0] === dynamicPrefix) {
    return null
  }

  if (restParts[0] && dedicatedRouteSegments.has(restParts[0])) {
    return null
  }

  /*
   * The path must be absolute — a relative URL resolves against the request
   * path's parent directory, mangling nested paths
   * (/solutions/foo → /solutions/en/dynamic/solutions/foo).
   */
  const rewriteUrl = new URL(
    "/" + [locale, dynamicPrefix, rest].filter(Boolean).join("/"),
    req.url
  )

  rewriteUrl.search = search

  const rewriteResponse = NextResponse.rewrite(rewriteUrl, intlProxy(req))
  rewriteResponse.headers.set("x-original-path", pathname)

  return rewriteResponse
}
