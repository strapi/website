import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { BlogNavbar } from "@/components/blog/BlogNavbar"
import { BlogPostsList } from "@/components/blog/BlogPostsList"
import { FeaturedBlogPost } from "@/components/blog/FeaturedBlogPost"
import { Container } from "@/components/elementary/Container"
import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import {
  fetchBlogNavigation,
  fetchBlogPostsList,
} from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const navigation = await fetchBlogNavigation(locale as Locale)
  const items = (navigation?.data as Record<string, unknown>)?.items as
    | readonly { slug?: string }[]
    | undefined

  return (
    items
      ?.filter((item) => item.slug)
      .map((item) => ({ slug: item.slug as string })) ?? []
  )
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const categoryName = slug
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `${categoryName} — Blog`,
  }
}

export default function BlogCategoryPage(
  props: PageProps<"/[locale]/blog/categories/[slug]">
) {
  const params = use(props.params)
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const [t, categoryPosts] = use(
    Promise.all([
      getTranslations({ locale, namespace: "blog" }),
      fetchBlogPostsList(locale, slug),
    ])
  )

  const featuredPost =
    (categoryPosts?.data[0] as Record<string, unknown> | undefined) ?? null
  const remainingPosts = categoryPosts?.data.slice(1) ?? []

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
      </HeroContainerContent>
    </HeroContainer>
  )
}
