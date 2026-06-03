import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs"
import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { StrapiSeoStructuredDataFromSeo } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { getBlogNewsletterHubspot, type BlogPost } from "@/lib/blog-utils"
import { getPostTagMetadata } from "@/lib/metadata"
import type { SeoComponent } from "@/lib/metadata/build-from-seo"
import {
  fetchAllPostTags,
  fetchBlog,
  fetchBlogPostsList,
  fetchPostTag,
} from "@/lib/strapi-api/content/server"

type TagWithExtras = {
  name?: string | null
  slug?: string | null
  description?: string | null
  seo?: SeoComponent | null
}

export const dynamic = "force-static"

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const tags = await fetchAllPostTags(locale as Locale)

  return (tags?.data ?? [])
    .map((tag) => tag?.slug)
    .filter(
      (slug): slug is string => typeof slug === "string" && slug.length > 0
    )
    .map((slug) => ({ slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale } = await props.params

  return (await getPostTagMetadata({ slug, locale: locale as Locale })) ?? {}
}

export default function BlogTagPage(
  props: PageProps<"/[locale]/blog/tags/[slug]">
) {
  const params = use(props.params)
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const [t, blog, tagRes] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlog(locale),
      fetchPostTag(slug, locale),
    ])
  )

  const tag = tagRes?.data as TagWithExtras | undefined

  const tagPosts = use(fetchBlogPostsList(locale, undefined, 20, slug))

  const hubspotForm = getBlogNewsletterHubspot(blog)
  const featuredPost: BlogPost | null = tagPosts?.data[0] ?? null
  const remainingPosts: BlogPost[] = tagPosts?.data.slice(1) ?? []
  const tagName = tag?.name ?? slug

  return (
    <>
      <StrapiSeoStructuredDataFromSeo seo={tag?.seo} />
      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent className="animate-reveal-cascade border-strapi-gray-700/50 flex flex-col gap-10 border-b">
          <div className="flex flex-col gap-6">
            <BlogBreadcrumbs tag={{ name: tagName, slug }} />

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {tagName}
            </h1>

            {tag?.description && (
              <div className="text-strapi-gray-300 max-w-3xl [&_p]:text-base [&_p:last-child]:mb-0">
                <InlineMarkdown allowNewLines>{tag.description}</InlineMarkdown>
              </div>
            )}
          </div>

          {featuredPost && <FeaturedBlogPost post={featuredPost} />}

          <BlogPostsList posts={remainingPosts} loadMoreLabel={t("loadMore")} />
        </HeroContainerContent>

        <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10 [--reveal-delay:680ms]">
          <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
        </HeroContainerContent>
      </HeroContainer>
    </>
  )
}
