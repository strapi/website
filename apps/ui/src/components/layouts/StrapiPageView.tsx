import { ROOT_PAGE_PATH } from "@repo/shared-data"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Breadcrumbs } from "@/components/elementary/Breadcrumbs"
import { Container } from "@/components/elementary/Container"
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

export function StrapiPageView({ params, searchParams }: Props) {
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const fullPath = ROOT_PAGE_PATH + (params.rest ?? []).join("/")
  const response = use(fetchPage(fullPath, locale))

  const data = response?.data
  if (data?.content == null) {
    notFound()
  }

  const { content, ...restPageData } = data

  return (
    <>
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
    </>
  )
}
