import type { Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { BlogPostCard } from "@/components/blog/BlogPostCard"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import {
  fetchLatestBlogPosts,
  fetchRelatedBlogPosts,
} from "@/lib/strapi-api/content/server"

interface BlogAutoRelatedPostsProps {
  readonly currentSlug: string
  readonly category: {
    readonly name?: string | null
    readonly slug?: string | null
  } | null
  readonly locale: Locale
  readonly limit?: number
}

export async function BlogAutoRelatedPosts({
  currentSlug,
  category,
  locale,
  limit = 3,
}: BlogAutoRelatedPostsProps) {
  const categorySlug = category?.slug

  const [t, res] = await Promise.all([
    getTranslations("blog"),
    categorySlug
      ? fetchRelatedBlogPosts({
          currentSlug,
          categorySlug,
          locale,
          limit,
        })
      : fetchLatestBlogPosts({
          locale,
          excludeSlugs: [currentSlug],
          limit,
        }),
  ])

  const posts = res?.data ?? []

  if (posts.length === 0) return null

  return (
    <section className="py-8 lg:py-16">
      <Container>
        <Box variant="dark" className="rounded-strapi-lg">
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-14">
            <div className="mb-8 flex flex-col items-center justify-between md:flex-row">
              <h4 className="text-3xl font-bold text-white">
                {category?.name ?? t("relatedPosts")}
              </h4>

              {category?.slug && (
                <Button
                  variant="link"
                  asChild
                  className="text-strapi-purple-400 hover:text-strapi-purple-300 uppercase"
                >
                  <Link href={`/blog/categories/${category.slug}`}>
                    {t("seeAllRelated", { category: category.name ?? "" })}
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.documentId ?? post.id} post={post} />
              ))}
            </div>
          </div>
        </Box>
      </Container>
    </section>
  )
}
