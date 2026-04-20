import type { Data } from "@repo/strapi-types"

import { BlogPostLinkRow } from "@/components/blog/BlogPostLinkRow"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"

export function StrapiEditorsPicks({
  component,
}: {
  readonly component: Data.Component<"blog.editors-picks">
}) {
  const blogPosts = component.blogPosts ?? []

  if (blogPosts.length === 0) {
    return null
  }

  return (
    <section className="py-8 lg:py-16">
      <Container className="relative">
        <Box
          variant="dark-inverse"
          className="rounded-strapi-lg px-10 py-10 lg:px-12 lg:py-12"
        >
          <div className="relative z-10 flex flex-col gap-6">
            <SectionHeader layout="left" size="sm">
              <SectionTitle size="sm" variant="inverse">
                {component.title}
              </SectionTitle>
            </SectionHeader>

            <div className="bg-strapi-gray-700/50 h-px" />

            <div className="flex flex-col gap-4">
              {blogPosts.map((post) => (
                <BlogPostLinkRow
                  key={post.documentId ?? post.id}
                  post={post}
                  showImage
                  showTags
                  showCategory={false}
                  className="border-strapi-gray-700/50 border-b pb-4 last:border-b-0 last:pb-0"
                />
              ))}
            </div>
          </div>
        </Box>
      </Container>
    </section>
  )
}
