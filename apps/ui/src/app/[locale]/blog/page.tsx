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
import { StrapiSeoStructuredDataByFullPath } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { getBlogNewsletterHubspot, type BlogPost } from "@/lib/blog-utils"
import { getBlogIndexMetadata } from "@/lib/metadata"
import { fetchBlog, fetchBlogPostsPage } from "@/lib/strapi-api/content/server"

export const revalidate = 3600

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params

  return (await getBlogIndexMetadata({ locale: locale as Locale })) ?? {}
}

export default function BlogIndexPage(props: PageProps<"/[locale]/blog">) {
  const params = use(props.params)
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const [t, allPosts, blog] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlogPostsPage(locale, { offset: 0, limit: 10 }),
      fetchBlog(locale),
    ])
  )

  const hubspotForm = getBlogNewsletterHubspot(blog)
  const featuredPost: BlogPost | null = allPosts.posts[0] ?? null
  const remainingPosts: BlogPost[] = allPosts.posts.slice(1)

  return (
    <>
      <StrapiSeoStructuredDataByFullPath fullPath="/blog" locale={locale} />
      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent className="animate-reveal-cascade border-strapi-gray-700/50 flex flex-col gap-10 border-b">
          {featuredPost && <FeaturedBlogPost post={featuredPost} />}

          <BlogPostsList
            posts={remainingPosts}
            locale={locale}
            initialOffset={allPosts.posts.length}
            total={allPosts.total}
            loadMoreLabel={t("loadMore")}
          />
        </HeroContainerContent>

        <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10 [--reveal-delay:680ms]">
          <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
        </HeroContainerContent>
      </HeroContainer>
    </>
  )
}
