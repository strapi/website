import type { Locale } from "next-intl"
import { use } from "react"

import { StrapiBlogPostView } from "@/components/layouts/StrapiBlogPostView"
import { createFallbackPath, debugStaticParams } from "@/lib/build"
import { isDevelopment } from "@/lib/general-helpers"
import { getBlogPostMetadata } from "@/lib/metadata/blog"
import { fetchAllBlogPosts } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"
export const revalidate = 14400

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  if (isDevelopment()) {
    debugStaticParams([], "blog/[slug]", { isDevelopment: true })

    return []
  }

  const results = await fetchAllBlogPosts(locale as Locale)

  const params =
    results?.data.map((post) => ({
      locale: post.locale as Locale,
      slug: post.slug,
    })) ?? []

  debugStaticParams(params, "blog/[slug]")

  const fallbackPath = createFallbackPath(locale as Locale, {
    slug: "fallback",
  })

  return params.length > 0 ? params : [fallbackPath]
}

export async function generateMetadata(
  props: PageProps<"/[locale]/blog/[slug]">
) {
  const params = await props.params
  const locale = params.locale as Locale
  const slug = params.slug as string

  return getBlogPostMetadata({ slug, locale })
}

export default function BlogPostPage(
  props: PageProps<"/[locale]/blog/[slug]">
) {
  const params = use(props.params)

  return <StrapiBlogPostView params={params} />
}
