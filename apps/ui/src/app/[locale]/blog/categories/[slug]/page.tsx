import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs"
import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import { Container } from "@/components/elementary/Container"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { Markdown } from "@/components/elementary/markdown/Markdown"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { getBlogNewsletterHubspot, type BlogPost } from "@/lib/blog-utils"
import {
  fetchBlog,
  fetchBlogPostsList,
  fetchPostCategory,
} from "@/lib/strapi-api/content/server"

type CategoryWithExtras = {
  name?: string | null
  slug?: string | null
  description?: string | null
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    keywords?: string | null
  } | null
  children?: ({ slug?: string | null } | null)[] | null
}

export const dynamic = "force-static"
export const revalidate = 14400

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
  const res = await fetchPostCategory(slug, locale as Locale)
  const category = res?.data as CategoryWithExtras | undefined
  const seo = category?.seo

  const fallbackName = slug
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())
  const name = category?.name ?? fallbackName

  return {
    title: seo?.metaTitle || `${name} — Blog`,
    description: seo?.metaDescription ?? undefined,
    keywords: seo?.keywords ?? undefined,
  }
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
    <HeroContainer affectsNavbarTheme className="gap-0">
      <BlogNavbar locale={locale} />

      <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10">
        <Container className="flex flex-col gap-6">
          <BlogBreadcrumbs category={{ name: categoryName, slug }} />

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {categoryName}
          </h1>

          {category?.description && (
            <div className="text-strapi-gray-300 max-w-3xl [&_p]:text-base [&_p:last-child]:mb-0">
              <Markdown>{category.description}</Markdown>
            </div>
          )}
        </Container>

        {featuredPost && (
          <Container>
            <FeaturedBlogPost post={featuredPost} />
          </Container>
        )}

        <Container>
          <BlogPostsList posts={remainingPosts} loadMoreLabel={t("loadMore")} />
        </Container>

        <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
      </HeroContainerContent>
    </HeroContainer>
  )
}
