import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import {
  type BlogAuthor,
  BlogAuthorBanner,
} from "@/components/blog/BlogAuthorBanner"
import { BlogContent } from "@/components/blog/BlogContent"
import type { AuthorAvatarData } from "@/components/elementary/AuthorAvatars"
import { Container } from "@/components/elementary/Container"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import {
  extractHeadings,
  type BlogCategory,
  type BlogPostImage,
  type BlogTag,
} from "@/lib/blog-utils"
import { fetchBlogPost } from "@/lib/strapi-api/content/server"

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

  const data = response?.data
  if (!data) {
    notFound()
  }

  const postData = data as Record<string, unknown>
  const sections = postData.sections as
    | { __component: string; id: number; [key: string]: unknown }[]
    | undefined
  const author = postData.author as BlogAuthor | null
  const content = typeof data.content === "string" ? data.content : null
  const headings = content ? extractHeadings(content) : []

  return (
    <>
      {content && <BlogReadingProgress />}

      <HeroContainer affectsNavbarTheme className="gap-0">
        <BlogNavbar locale={locale} />

        <HeroContainerContent>
          <Container>
            <BlogPostHeader
              title={data.title ?? ""}
              publishedAt={data.publishedAt as string | null}
              content={content}
              author={author}
              coauthors={postData.coauthors as AuthorAvatarData[] | undefined}
              category={postData.category as BlogCategory | null}
              tags={postData.tags as BlogTag[] | undefined}
              image={postData.image as BlogPostImage | null}
            />
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

                <Container>
                  <article
                    data-slot="blog-article"
                    className="mx-auto max-w-210"
                  >
                    <BlogContent>{content}</BlogContent>
                  </article>

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
            />
          )}
        </main>
      </div>
    </>
  )
}
