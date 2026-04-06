import type { Data } from "@repo/strapi-types"
import { getTranslations } from "next-intl/server"

import { BlogPostLinkRow } from "@/components/blog/BlogPostLinkRow"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { Link } from "@/lib/navigation"

export async function StrapiCategoryShowcase({
  component,
}: {
  readonly component: Data.Component<"blog.category-showcase">
}) {
  const t = await getTranslations("blog")
  const category = component.category as {
    name?: string
    slug?: string
  } | null
  const blogPosts = (component.blogPosts ?? []) as Record<string, unknown>[]

  if (blogPosts.length === 0) {
    return null
  }

  const seeAllLabel =
    component.seeAllLabel ??
    t("seeAllRelated", { category: category?.name ?? "" })

  return (
    <section className="py-8 lg:py-16">
      <Container className="relative">
        <Box
          variant="dark-inverse"
          className="rounded-strapi-lg px-10 py-10 lg:px-12 lg:py-12"
        >
          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-4">
              <SectionHeader layout="left" size="sm">
                <SectionTitle size="sm" variant="inverse">
                  {category?.name ?? t("articles")}
                </SectionTitle>
              </SectionHeader>

              {category?.slug && (
                <Link
                  href={`/blog/categories/${category.slug}`}
                  className="text-strapi-purple-400 hover:text-strapi-purple-300 text-sm font-semibold transition-colors"
                >
                  {seeAllLabel} →
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-strapi-gray-700/50 h-px lg:hidden" />

              {blogPosts.map((post) => (
                <BlogPostLinkRow
                  key={(post.documentId as string) ?? (post.id as number)}
                  post={post}
                  className="border-strapi-gray-700/50 border-b py-4 last:border-b-0"
                />
              ))}
            </div>
          </div>
        </Box>
      </Container>
    </section>
  )
}
