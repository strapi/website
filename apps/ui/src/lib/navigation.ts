import {
  normalizePageFullPath,
  resolveStaticRedirectDestination,
} from "@repo/shared-data"
import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"

import { getEnvVar } from "@/lib/env-vars"

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en"],

  // Used when no locale matches
  defaultLocale: "en",

  localePrefix: "as-needed",
})

// https://next-intl-docs.vercel.app/docs/routing/navigation
export const {
  Link,
  redirect: _redirect,
  usePathname,
  useRouter,
} = createNavigation(routing)

// Help TypeScript detect unreachable code
// https://next-intl-docs.vercel.app/docs/routing/navigation#redirect
export const redirect: typeof _redirect = _redirect

/**
 * Function to check if a given link belongs to the same application - it is internal link.
 *
 * @param link
 * @returns true if the link is internal, false otherwise
 */
export const isAppLink = (link: string): boolean => {
  try {
    const baseUrl = getEnvVar("APP_PUBLIC_URL", true) as string
    const url = new URL(link, baseUrl)

    return url.hostname === new URL(baseUrl).hostname
  } catch {
    return false
  }
}

/**
 * Creates a full public URL for a given path and locale.
 * Omits the locale prefix for the default locale (as-needed strategy).
 */
export const createPublicFullPath = (
  fullPath: string,
  locale: string
): string => {
  const baseUrl = getEnvVar("APP_PUBLIC_URL", true)!
  const isDefaultLocale = locale === routing.defaultLocale

  const path = normalizePageFullPath(
    [fullPath],
    isDefaultLocale ? null : locale
  )

  // new URL("/", baseUrl) always adds a trailing slash for root paths — strip it
  return new URL(path, baseUrl).toString().replace(/\/$/, "")
}

export const formatHref = (href: string | undefined | null): string => {
  if (!href || href === "#") {
    // Empty path -> return hash to prevent unwanted issues
    return "#"
  }

  if (href.startsWith("http")) {
    // External or internal link that starts with http(s) -> return as is
    return href
  }

  if (!isAppLink(href)) {
    // External link -> return as is
    return href
  }

  if (!href.startsWith("/")) {
    // Ensure path starts with a slash
    href = `/${href}`
  }

  return resolveStaticallyRedirectedHref(href)
}

/**
 * Rewrites app paths that the static `next.config` redirect table would
 * redirect anyway, so links render with the final destination. Prefetching a
 * link whose path 308s to another origin fails with a CORS error and wastes
 * the redirect hop; resolved external destinations instead render as plain
 * `<a>` tags (no prefetch) in the link components.
 *
 * Runtime redirects (the Strapi `redirect` collection) are intentionally NOT
 * resolved here — they stay request-time in the proxy so editor changes apply
 * without waiting for a rebuild or ISR revalidation. The static table has no
 * such freshness concern: it only changes with a deploy, exactly like the
 * rendered pages that embed these hrefs.
 */
const resolveStaticallyRedirectedHref = (href: string): string => {
  const suffixIndex = href.search(/[?#]/)
  const path = suffixIndex === -1 ? href : href.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex)

  const destination = resolveStaticRedirectDestination(path)

  if (!destination) {
    return href
  }

  const resolved =
    suffix.startsWith("?") && destination.includes("?")
      ? `${destination}&${suffix.slice(1)}`
      : `${destination}${suffix}`

  // A few destinations are absolute URLs on our own host (e.g.
  // https://strapi.io/contact-sales) — reduce those to a path so they keep
  // client-side navigation instead of a full page load.
  try {
    const baseUrl = getEnvVar("APP_PUBLIC_URL", true) as string
    const url = new URL(resolved)

    if (url.hostname === new URL(baseUrl).hostname) {
      return `${url.pathname}${url.search}${url.hash}` || "/"
    }
  } catch {
    // Relative destination — already an app path.
  }

  return resolved
}
