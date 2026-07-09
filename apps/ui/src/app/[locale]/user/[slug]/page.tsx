import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { AuthorHero } from "@/components/blog/AuthorHero"
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs"
import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { getBlogNewsletterHubspot, type BlogPost } from "@/lib/blog-utils"
import { debugStaticParams } from "@/lib/build"
import { isDevelopment } from "@/lib/general-helpers"
import { getAuthorMetadata } from "@/lib/metadata"
import {
  fetchAllBlogAuthorSlugs,
  fetchAuthor,
  fetchBlog,
  fetchBlogPostsPage,
} from "@/lib/strapi-api/content/server"

export const revalidate = 3600

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  // Author slugs are derived by scanning every published post — skip the
  // expensive fetch in dev; authors are still served on demand.
  if (isDevelopment()) {
    debugStaticParams([], "user/[slug]", { isDevelopment: true })

    return []
  }

  const slugs = await fetchAllBlogAuthorSlugs(locale as Locale)
  const params = slugs.map((slug) => ({ slug }))

  debugStaticParams(params, "user/[slug]")

  return params
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale } = await props.params

  return (await getAuthorMetadata({ slug, locale: locale as Locale })) ?? {}
}

export default function AuthorPage(props: PageProps<"/[locale]/user/[slug]">) {
  const params = use(props.params)
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const [t, blog, author] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlog(locale),
      fetchAuthor(slug),
    ])
  )

  if (!author) {
    notFound()
  }

  const authorPosts = use(
    fetchBlogPostsPage(locale, { offset: 0, limit: 10, authorSlug: slug })
  )

  // Old-site parity: authors without a single published post have no page
  if (authorPosts.total === 0) {
    notFound()
  }

  const hubspotForm = getBlogNewsletterHubspot(blog)
  const featuredPost: BlogPost | null = authorPosts.posts[0] ?? null
  const remainingPosts: BlogPost[] = authorPosts.posts.slice(1)

  return (
    <HeroContainer affectsNavbarTheme className="gap-0">
      <BlogNavbar locale={locale} />

      <HeroContainerContent className="animate-reveal-cascade border-strapi-gray-700/50 flex flex-col gap-10 border-b">
        <div className="flex flex-col gap-6">
          <BlogBreadcrumbs author={{ name: author.username ?? slug, slug }} />

          <AuthorHero author={author} />
        </div>

        {featuredPost && <FeaturedBlogPost post={featuredPost} />}

        <BlogPostsList
          posts={remainingPosts}
          locale={locale}
          initialOffset={authorPosts.posts.length}
          total={authorPosts.total}
          authorSlug={slug}
          loadMoreLabel={t("loadMore")}
        />
      </HeroContainerContent>

      <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10 [--reveal-delay:680ms]">
        <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
      </HeroContainerContent>
    </HeroContainer>
  )
}
