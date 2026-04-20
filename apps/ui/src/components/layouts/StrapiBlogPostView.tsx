import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import {
  type BlogAuthor,
  BlogAuthorBanner,
} from "@/components/blog/BlogAuthorBanner"
import { BlogAutoRelatedPosts } from "@/components/blog/BlogAutoRelatedPosts"
import { BlogContent } from "@/components/blog/BlogContent"
import { BlogSocialShare } from "@/components/blog/BlogSocialShare"
import { Container } from "@/components/elementary/Container"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { extractHeadings, type BlogPost } from "@/lib/blog-utils"
import { getEnvVar } from "@/lib/env-vars"
import { routing } from "@/lib/navigation"
import { fetchBlogPost } from "@/lib/strapi-api/content/server"
import { buildBlogPostingJsonLd } from "@/lib/structured-data/blog-posting"

import { BlogNavbar } from "../blog/BlogNavbar"
import { BlogPostHeader } from "../blog/BlogPostHeader"
import { BlogReadingProgress } from "../blog/BlogReadingProgress"
import { BlogTableOfContents } from "../blog/BlogTableOfContents"
import {
  HeroContainer,
  HeroContainerContent,
} from "../elementary/HeroContainer"

interface Props {
  params: {
    locale: string
    slug: string
  }
}

export function StrapiBlogPostView({ params }: Props) {
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const response = use(fetchBlogPost(slug, locale))

  const post = response?.data as BlogPost | null | undefined
  if (!post) {
    notFound()
  }

  const sections = post.sections
  const author = post.author as BlogAuthor | null
  const content = post.content
  const headings = content ? extractHeadings(content) : []
  const hasManualRelated = (sections ?? []).some(
    (s) =>
      s?.__component === "blog.related-posts" ||
      s?.__component === "blog.editors-picks"
  )

  const siteUrl = getEnvVar("APP_PUBLIC_URL") ?? ""
  const localePath = routing.defaultLocale !== locale ? `/${locale}` : ""
  const postUrl = siteUrl
    ? new URL(`${localePath}/blog/${slug}`, siteUrl).toString()
    : `${localePath}/blog/${slug}`

  const jsonLd = buildBlogPostingJsonLd({
    post,
    url: postUrl,
    siteUrl: siteUrl || undefined,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {content && <BlogReadingProgress />}

      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent>
          <Container>
            <BlogPostHeader post={post} />
          </Container>
        </HeroContainerContent>
      </HeroContainer>

      <div className="flex w-full flex-col">
        <main className="flex w-full flex-col">
          {content && (
            <section className="py-8 lg:py-16">
              <div className="relative">
                {headings.length > 0 && (
                  <aside className="absolute top-0 left-0 hidden h-full xl:block">
                    <BlogTableOfContents headings={headings} />
                  </aside>
                )}

                <Container variant="condensed">
                  <article data-slot="blog-article">
                    <BlogContent>{content}</BlogContent>
                  </article>

                  <BlogSocialShare url={postUrl} title={post.title ?? ""} />

                  <BlogAuthorBanner author={author} />
                </Container>
              </div>
            </section>
          )}

          {sections && sections.length > 0 && (
            <DynamicZoneRenderer
              content={sections}
              itemClassName="mb-6 md:mb-10 lg:mb-14"
              surface="page"
              extraProps={{ currentSlug: slug, locale }}
            />
          )}

          {!hasManualRelated && (
            <BlogAutoRelatedPosts
              currentSlug={slug}
              category={
                (
                  post as unknown as {
                    category?: {
                      name?: string | null
                      slug?: string | null
                    } | null
                  }
                ).category ?? null
              }
              locale={locale}
            />
          )}
        </main>
      </div>
    </>
  )
}
