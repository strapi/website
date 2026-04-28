import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { getBlogNewsletterHubspot, type BlogPost } from "@/lib/blog-utils"
import { routing } from "@/lib/navigation"
import { fetchBlog, fetchBlogPostsList } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale: locale as "en",
    namespace: "blog",
  })

  const localePath = routing.defaultLocale !== locale ? `/${locale}` : ""

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      types: {
        "application/rss+xml": `${localePath}/blog/rss.xml`,
      },
    },
  }
}

export default function BlogIndexPage(props: PageProps<"/[locale]/blog">) {
  const params = use(props.params)
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const [t, allPosts, blog] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlogPostsList(locale, undefined, 20),
      fetchBlog(locale),
    ])
  )

  const hubspotForm = getBlogNewsletterHubspot(blog)
  const featuredPost: BlogPost | null = allPosts?.data[0] ?? null
  const remainingPosts: BlogPost[] = allPosts?.data.slice(1) ?? []

  return (
    <HeroContainer affectsNavbarTheme className="gap-0">
      <BlogNavbar locale={locale} />

      <HeroContainerContent className="animate-reveal-cascade border-strapi-gray-700/50 flex flex-col gap-10 border-b">
        {featuredPost && <FeaturedBlogPost post={featuredPost} />}

        <BlogPostsList posts={remainingPosts} loadMoreLabel={t("loadMore")} />
      </HeroContainerContent>

      <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10 [--reveal-delay:680ms]">
        <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
      </HeroContainerContent>
    </HeroContainer>
  )
}
