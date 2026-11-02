import { ROOT_PAGE_PATH } from "@repo/shared-data"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Breadcrumbs } from "@/components/elementary/Breadcrumbs"
import { Container } from "@/components/elementary/Container"
import { MinimalHeader } from "@/components/layouts/MinimalHeader"
import { StrapiLegalPages } from "@/components/page-builder/components/sections/StrapiLegalPages"
import { StrapiSeoStructuredDataFromSeo } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { StrapiStructuredData } from "@/components/page-builder/components/seo-utilities/StrapiStructuredData"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { FirstTouchScript } from "@/components/providers/TrackingScripts"
import { getEnvVar } from "@/lib/env-vars"
import { legalPagePath } from "@/lib/legal-page-path"
import { createPublicFullPath } from "@/lib/navigation"
import { SECTION_SPACING } from "@/lib/section-spacing"
import { resolvePageRoute } from "@/lib/strapi-api/content/server"
import { buildWebPageJsonLd } from "@/lib/structured-data/site-graph"
import { cn } from "@/lib/styles"

interface Props {
  params: {
    locale: string
    rest?: string[]
  }
  searchParams?: Record<string, string | string[] | undefined>
}

/**
 * Renders a Strapi page with its dynamic zone content.
 *
 * ## Minimal layout
 *
 * When `page.minimalLayout` is `true` (a boolean toggle in Strapi, off by default),
 * the full site header and footer are hidden and replaced with a logo-only
 * {@link MinimalHeader}. This is used for landing pages, demo forms, and checkout
 * flows where navigation chrome is undesirable.
 *
 * **How it works:** A hidden `<div data-minimal-layout>` marker is rendered
 * server-side. A CSS `:has()` rule in `globals.css` hides the layout-level
 * `[data-slot="site-header"]` and `[data-slot="site-footer"]` wrappers.
 * This keeps header/footer in the layout (preserving navigation state across
 * page transitions) while hiding them purely via CSS — no client JS needed.
 *
 * The outer `<div className="flex w-full flex-col">` is required because the
 * parent route layout (`[[...rest]]/layout.tsx`) uses `flex items-center`
 * (horizontal flex). Without this wrapper, the MinimalHeader and main content
 * would render side-by-side instead of stacked vertically.
 */
export function StrapiPageView({ params, searchParams }: Props) {
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const fullPath = ROOT_PAGE_PATH + (params.rest ?? []).join("/")
  const resolved = use(resolvePageRoute(fullPath, locale))

  if (resolved?.response.data?.content == null) {
    notFound()
  }

  const data = resolved.response.data
  const content = data.content

  if (content == null) {
    notFound()
  }

  const activeLegalPage = resolved.activeLegalPage
  const { minimalLayout, ...restPageData } = data
  const blocks = content.filter(
    (block): block is NonNullable<(typeof content)[number]> => block != null
  )
  const legalBlock = blocks.find(
    (block) => block.__component === "sections.legal-pages"
  )
  const pageSections = blocks.filter(
    (block) => block.__component !== "sections.legal-pages"
  )
  const breadcrumbs =
    activeLegalPage?.title && activeLegalPage.slug && data.fullPath
      ? [
          ...(resolved.response.meta?.breadcrumbs ?? []),
          {
            title: activeLegalPage.title,
            fullPath: legalPagePath(data.fullPath, activeLegalPage.slug),
          },
        ]
      : resolved.response.meta?.breadcrumbs

  const siteUrl = getEnvVar("APP_PUBLIC_URL")
  const webPageJsonLd = siteUrl
    ? buildWebPageJsonLd({
        siteUrl,
        url: createPublicFullPath(fullPath, locale),
        name:
          activeLegalPage?.seo?.metaTitle ??
          activeLegalPage?.title ??
          data.seo?.metaTitle ??
          undefined,
        description:
          activeLegalPage?.seo?.metaDescription ??
          data.seo?.metaDescription ??
          undefined,
        locale,
      })
    : null

  return (
    <div className="flex w-full flex-col">
      {data.fullPath === "/contact-sales" && <FirstTouchScript />}
      {minimalLayout && <div data-minimal-layout hidden />}
      {minimalLayout && <MinimalHeader />}
      <StrapiSeoStructuredDataFromSeo seo={data?.seo} />
      {webPageJsonLd && (
        <StrapiStructuredData
          structuredData={webPageJsonLd}
          id="webPageStructuredData"
        />
      )}
      <main className={cn("flex w-full flex-col")}>
        <Container>
          <Breadcrumbs breadcrumbs={breadcrumbs} locale={locale} />
        </Container>

        {legalBlock ? (
          <StrapiLegalPages
            component={legalBlock}
            page={restPageData}
            sections={activeLegalPage ? [] : pageSections}
            activeLegalPage={activeLegalPage}
            extraProps={{
              pageParams: params,
              page: restPageData,
              searchParams,
            }}
          />
        ) : (
          <DynamicZoneRenderer
            content={blocks}
            itemClassName={SECTION_SPACING}
            surface="page"
            extraProps={{
              pageParams: params,
              page: restPageData,
              searchParams,
            }}
          />
        )}
      </main>
    </div>
  )
}
