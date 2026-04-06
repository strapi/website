import type { Data } from "@repo/strapi-types"
import { getTranslations } from "next-intl/server"

import { BlogPostCard } from "@/components/blog/BlogPostCard"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { Link } from "@/lib/navigation"

export async function StrapiRelatedPosts({
  component,
}: {
  readonly component: Data.Component<"blog.related-posts">
}) {
  const t = await getTranslations("blog")
  const blogPosts = (component.blogPosts ?? []) as Record<string, unknown>[]
  const category = component.category as { name?: string; slug?: string } | null

  if (blogPosts.length === 0) {
    return null
  }

  const hasSection = component.section?.title || component.section?.description

  return (
    <section className="py-8 lg:py-16">
      <Container>
        <Box variant="dark" className="rounded-strapi-lg">
          <div className="relative z-10 px-8 py-10 lg:px-12 lg:py-14">
            {hasSection ? (
              <div className="mb-8">
                <StrapiSectionHeader
                  component={component.section!}
                  variantOverride="inverse"
                />
              </div>
            ) : (
              <div className="mb-8 flex items-center justify-between">
                <SectionHeader layout="left" size="sm">
                  <SectionTitle size="sm" variant="inverse">
                    {category?.name ?? t("relatedPosts")}
                  </SectionTitle>
                </SectionHeader>

                {category?.slug && (
                  <Link
                    href={`/blog/categories/${category.slug}`}
                    className="text-strapi-purple-400 hover:text-strapi-purple-300 text-sm font-semibold tracking-wider uppercase transition-colors"
                  >
                    {t("seeAllRelated", { category: category.name ?? "" })}
                  </Link>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <BlogPostCard
                  key={(post.documentId as string) ?? (post.id as number)}
                  title={post.title as string}
                  slug={post.slug as string}
                  content={post.content as string | null}
                  publishedAt={post.publishedAt as string | null}
                  author={
                    post.author as Parameters<typeof BlogPostCard>[0]["author"]
                  }
                  coauthors={
                    post.coauthors as Parameters<
                      typeof BlogPostCard
                    >[0]["coauthors"]
                  }
                  category={
                    post.category as Parameters<
                      typeof BlogPostCard
                    >[0]["category"]
                  }
                  image={
                    post.image as Parameters<typeof BlogPostCard>[0]["image"]
                  }
                />
              ))}
            </div>
          </div>
        </Box>
      </Container>
    </section>
  )
}
