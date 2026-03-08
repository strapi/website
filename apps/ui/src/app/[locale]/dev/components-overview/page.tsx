import { uniq } from "lodash"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { ComponentsList } from "@/app/[locale]/dev/components-overview/components/ComponentsList"
import { logNonBlockingError } from "@/lib/logging"
import { PublicStrapiClient } from "@/lib/strapi-api"

export const dynamic = "force-dynamic"

async function fetchAllPages(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll("api::page.page", {
      locale,
      populate: { content: true },
      status: "published",
    })
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all pages for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export default async function ComponentsOverviewPage({
  params,
}: PageProps<"/[locale]/dev/components-overview">) {
  const { locale } = (await params) as { locale: Locale }
  setRequestLocale(locale)

  const response = await fetchAllPages(locale)

  const pages = response?.data ?? []

  const components = uniq(
    pages.flatMap(
      (page) =>
        page.content?.map(
          (block: { __component: string }) => block.__component
        ) ?? []
    )
  ).sort((a, b) => a.localeCompare(b))

  return (
    <>
      <h1 className="text-foreground text-5xl font-bold tracking-tight">
        All Components ({components?.length})
      </h1>
      <ComponentsList components={components} pages={pages} />
    </>
  )
}
