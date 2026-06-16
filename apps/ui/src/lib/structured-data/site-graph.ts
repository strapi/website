/**
 * Site-wide JSON-LD builders mirroring the schema.org graph the legacy
 * strapi.io site emitted on every page: a global `Organization` + `WebSite`
 * pair (rendered once in the root layout) and a per-page `WebPage` node
 * (rendered by each page view). The nodes are cross-linked by `@id`, so search
 * engines merge them into a single graph even though they live in separate
 * `<script>` tags.
 */

/** Absolute URL of the Strapi logo, resolved against the public site URL. */
const ORG_LOGO_PATH = "/images/logo/strapi-full-logo-dark.svg"

const stripTrailingSlash = (url: string) => {
  let end = url.length
  while (end > 0 && url[end - 1] === "/") {
    end--
  }

  return url.slice(0, end)
}

export const organizationId = (siteUrl: string) =>
  `${stripTrailingSlash(siteUrl)}/#organization`

export const websiteId = (siteUrl: string) =>
  `${stripTrailingSlash(siteUrl)}/#website`

interface OrgWebsiteArgs {
  readonly siteUrl: string
  readonly name: string
  readonly description?: string
  readonly locale: string
}

/** Builds the global `Organization` + `WebSite` graph (page-independent). */
export function buildOrgWebsiteGraph({
  siteUrl,
  name,
  description,
  locale,
}: OrgWebsiteArgs) {
  const base = stripTrailingSlash(siteUrl)
  const orgId = organizationId(base)
  const logoUrl = new URL(ORG_LOGO_PATH, base).toString()

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name,
        url: base,
        sameAs: [],
        logo: {
          "@type": "ImageObject",
          "@id": `${base}/#logo`,
          inLanguage: locale,
          url: logoUrl,
          caption: name,
        },
        image: logoUrl,
      },
      {
        "@type": "WebSite",
        "@id": websiteId(base),
        url: base,
        name,
        ...(description ? { description } : {}),
        publisher: { "@id": orgId },
      },
    ],
  }
}

interface WebPageArgs {
  readonly siteUrl: string
  readonly url: string
  readonly name?: string
  readonly description?: string
  readonly locale: string
}

/** Builds a per-page `WebPage` node linked to the global Organization/WebSite. */
export function buildWebPageJsonLd({
  siteUrl,
  url,
  name,
  description,
  locale,
}: WebPageArgs) {
  const base = stripTrailingSlash(siteUrl)

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    ...(name ? { name } : {}),
    isPartOf: { "@id": websiteId(base) },
    about: { "@id": organizationId(base) },
    ...(description ? { description } : {}),
    inLanguage: locale,
    potentialAction: [{ "@type": "ReadAction", target: [url] }],
  }
}
