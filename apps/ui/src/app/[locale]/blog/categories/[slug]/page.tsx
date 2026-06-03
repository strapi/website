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
import { getPostCategoryMetadata } from "@/lib/metadata"
import type { SeoComponent } from "@/lib/metadata/build-from-seo"
import {
  fetchBlog,
  fetchBlogPostsList,
  fetchPostCategory,
} from "@/lib/strapi-api/content/server"

type CategoryWithExtras = {
  name?: string | null
  slug?: string | null
  description?: string | null
  seo?: SeoComponent | null
  children?: ({ slug?: string | null } | null)[] | null
}

export const dynamic = "force-static"

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const blog = await fetchBlog(locale as Locale)
  const items = blog?.data?.navigation?.items ?? []

  const slugs = new Set<string>()

  for (const item of items) {
    if (item.slug) slugs.add(item.slug)
    for (const child of item.children ?? []) {
      if (child.slug) slugs.add(child.slug)
    }
  }

  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale } = await props.params

  return (
    (await getPostCategoryMetadata({
      slug,
      locale: locale as Locale,
    })) ?? {}
  )
}

export default function BlogCategoryPage(
  props: PageProps<"/[locale]/blog/categories/[slug]">
) {
  const params = use(props.params)
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const [t, blog, categoryRes] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlog(locale),
      fetchPostCategory(slug, locale),
    ])
  )

  const category = categoryRes?.data as CategoryWithExtras | undefined
  const childSlugs = (category?.children ?? [])
    .map((c) => c?.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0)
  const allSlugs: string[] = [slug, ...childSlugs]

  const categoryPosts = use(fetchBlogPostsList(locale, allSlugs, 20))

  const hubspotForm = getBlogNewsletterHubspot(blog)
  const featuredPost: BlogPost | null = categoryPosts?.data[0] ?? null
  const remainingPosts: BlogPost[] = categoryPosts?.data.slice(1) ?? []
  const categoryName = category?.name ?? featuredPost?.category?.name ?? slug

  return (
    <>
      <StrapiSeoStructuredDataFromSeo seo={category?.seo} />
      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent className="animate-reveal-cascade border-strapi-gray-700/50 flex flex-col gap-10 border-b">
          <div className="flex flex-col gap-6">
            <BlogBreadcrumbs category={{ name: categoryName, slug }} />

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {categoryName}
            </h1>

            {category?.description && (
              <div className="text-background/60 max-w-full lg:max-w-1/2 [&_p:last-child]:mb-0">
                <InlineMarkdown allowNewLines>
                  {category.description}
                </InlineMarkdown>
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
