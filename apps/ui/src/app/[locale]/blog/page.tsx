import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogNewsletter } from "@/components/blog/BlogNewsletter"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import { Container } from "@/components/elementary/Container"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import type { NewsletterFormData } from "@/components/newsletter/NewsletterForm"
import { fetchBlog, fetchBlogPostsList } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"

export default function BlogIndexPage(props: PageProps<"/[locale]/blog">) {
  const params = use(props.params)
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const [t, allPosts, blog] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlogPostsList(locale),
      fetchBlog(locale),
    ])
  )

  const newsletter = (blog?.data as Record<string, unknown> | undefined)
    ?.newsletter as NewsletterFormData | undefined

  const featuredPost =
    (allPosts?.data[0] as Record<string, unknown> | undefined) ?? null
  const remainingPosts = allPosts?.data.slice(1) ?? []

  return (
    <HeroContainer affectsNavbarTheme className="gap-0">
      <BlogNavbar locale={locale} />

      <HeroContainerContent className="animate-reveal-cascade flex flex-col gap-10">
        {featuredPost && (
          <Container>
            <FeaturedBlogPost
              title={featuredPost.title as string}
              slug={featuredPost.slug as string}
              content={featuredPost.content as string | null}
              publishedAt={featuredPost.publishedAt as string | null}
              author={
                featuredPost.author as Parameters<
                  typeof FeaturedBlogPost
                >[0]["author"]
              }
              coauthors={
                featuredPost.coauthors as Parameters<
                  typeof FeaturedBlogPost
                >[0]["coauthors"]
              }
              category={
                featuredPost.category as Parameters<
                  typeof FeaturedBlogPost
                >[0]["category"]
              }
              image={
                featuredPost.image as Parameters<
                  typeof FeaturedBlogPost
                >[0]["image"]
              }
            />
          </Container>
        )}

        <Container>
          <BlogPostsList
            posts={
              remainingPosts as unknown as Parameters<
                typeof BlogPostsList
              >[0]["posts"]
            }
            loadMoreLabel={t("loadMore")}
          />
        </Container>

        {newsletter && <BlogNewsletter newsletter={newsletter} />}
      </HeroContainerContent>
    </HeroContainer>
  )
}
