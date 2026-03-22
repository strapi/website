import { ROOT_PAGE_PATH } from "@repo/shared-data"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Breadcrumbs } from "@/components/elementary/Breadcrumbs"
import { Container } from "@/components/elementary/Container"
import { MinimalHeader } from "@/components/layouts/MinimalHeader"
import { StrapiStructuredData } from "@/components/page-builder/components/seo-utilities/StrapiStructuredData"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { fetchPage } from "@/lib/strapi-api/content/server"
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
  const response = use(fetchPage(fullPath, locale))

  const data = response?.data
  if (data?.content == null) {
    notFound()
  }

  const { content, minimalLayout, ...restPageData } = data

  return (
    <div className="flex w-full flex-col">
      {minimalLayout && <div data-minimal-layout hidden />}
      {minimalLayout && <MinimalHeader />}

      <StrapiStructuredData structuredData={data?.seo?.structuredData} />

      <main className={cn("flex w-full flex-col")}>
        <Container>
          <Breadcrumbs
            breadcrumbs={response?.meta?.breadcrumbs}
            locale={locale}
          />
        </Container>

        <DynamicZoneRenderer
          content={content}
          itemClassName="mb-6 md:mb-10 lg:mb-14"
          surface="page"
          extraProps={{
            pageParams: params,
            page: restPageData,
            searchParams,
          }}
        />
      </main>
    </div>
  )
}
