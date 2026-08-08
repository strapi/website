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
import { BlogSidebar } from "@/components/blog/BlogSidebar"
import { BlogSocialShare } from "@/components/blog/BlogSocialShare"
import { Container } from "@/components/elementary/Container"
import { StrapiSeoStructuredDataFromSeo } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { extractHeadings, type BlogPost } from "@/lib/blog-utils"
import { getEnvVar } from "@/lib/env-vars"
import { routing } from "@/lib/navigation"
import { SECTION_SPACING } from "@/lib/section-spacing"
import { fetchBlog, fetchBlogPost } from "@/lib/strapi-api/content/server"
import { buildBlogPostingJsonLd } from "@/lib/structured-data/blog-posting"
import { cn } from "@/lib/styles"

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
  // Blog-wide sidebar defaults, overridden per post when the post sets its own.
  const blogSettings = use(fetchBlog(locale))

  const post = response?.data as BlogPost | null | undefined
  if (!post) {
    notFound()
  }

  // Same resolution the sidebar itself applies: a post overrides the blog-wide
  // default outright. Needed here too, because the surrounding layout changes
  // when a side column is present.
  const sidebarCards = post.sidebar?.length
    ? post.sidebar
    : (blogSettings?.data?.sidebar ?? [])
  const hasSidebar = sidebarCards.length > 0

  const sections = post.sections
  const author = post.author as BlogAuthor | null
  const intro = post.intro
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

  const hasStrapiStructuredData = Boolean(post.seo?.structuredData)
  const jsonLd = hasStrapiStructuredData
    ? null
    : buildBlogPostingJsonLd({
        post,
        url: postUrl,
        siteUrl: siteUrl || undefined,
      })

  return (
    <>
      <StrapiSeoStructuredDataFromSeo seo={post.seo} />
      {jsonLd && (
        <script
          id="blogPostingStructuredData"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {content && <BlogReadingProgress />}

      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent>
          <BlogPostHeader post={post} />
        </HeroContainerContent>
      </HeroContainer>

      <div className="flex w-full flex-col">
        <main className="flex w-full flex-col">
          {intro && intro.length > 0 && (
            <div className="pt-8 lg:pt-16">
              <DynamicZoneRenderer
                content={intro}
                itemClassName="mb-8 md:mb-12 lg:mb-16 last:mb-0"
                surface="page"
                extraProps={{ currentSlug: slug, locale }}
              />
            </div>
          )}

          {content && (
            <section className="py-8 lg:py-16">
              <div className="relative">
                {/* With a side column the ToC becomes a real column in the
                    row, so all four tracks line up on the site grid. Without
                    one it keeps its original full-bleed absolute position. */}
                <div
                  className={cn(
                    "mx-auto flex justify-center",
                    hasSidebar && "w-full max-w-312 gap-8 px-4 xl:px-0"
                  )}
                >
                  {headings.length > 0 && (
                    <aside
                      className={cn(
                        "hidden h-full",
                        hasSidebar
                          ? "w-52 shrink-0 xl:block"
                          : "absolute top-0 left-0 xl:block"
                      )}
                    >
                      <BlogTableOfContents headings={headings} />
                    </aside>
                  )}

                  <div className="relative w-full max-w-216 min-w-0">
                    <Container variant="condensed">
                      <article data-slot="blog-article">
                        <BlogContent>{content}</BlogContent>
                      </article>

                      <BlogSocialShare
                        url={postUrl}
                        title={post.title ?? ""}
                        variant="row"
                        className="xl:hidden"
                      />

                      {/* No room beside the article below xl, so the cards
                          flow into the article width rather than vanishing
                          or keeping the rail's narrow column. */}
                      <BlogSidebar
                        variant="inline"
                        className="mt-8 xl:hidden"
                        postCards={post.sidebar}
                        defaultCards={blogSettings?.data?.sidebar}
                      />

                      <BlogAuthorBanner author={author} />
                    </Container>

                    {/* Anchored to the article, not the viewport, so it holds
                        its place whether or not a side column is present. */}
                    <aside className="absolute top-0 left-full ml-4 hidden h-full xl:block">
                      <div className="sticky top-28 pb-24">
                        <BlogSocialShare
                          url={postUrl}
                          title={post.title ?? ""}
                          variant="sticky"
                        />
                      </div>
                    </aside>
                  </div>

                  {/* ml clears the share rail, which is absolutely positioned
                      just outside the article and would otherwise sit flush
                      against the cards. */}
                  {/* A sticky element can only travel through space its
                      container has left over. The share rail is short so it
                      always has room; a tall card stack does not — hence the
                      viewport cap, which keeps the column pinned (scrolling
                      internally if needed) instead of drifting off-screen.
                      Bottom padding is kept small for the same reason. */}
                  <BlogSidebar
                    className="hidden shrink-0 xl:ml-20 xl:block"
                    innerClassName="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8"
                    postCards={post.sidebar}
                    defaultCards={blogSettings?.data?.sidebar}
                  />
                </div>
              </div>
            </section>
          )}

          {sections && sections.length > 0 && (
            <DynamicZoneRenderer
              content={sections}
              itemClassName={SECTION_SPACING}
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
