import type { Data } from "@repo/strapi-types"

import { BlogPostLinkRow } from "@/components/blog/BlogPostLinkRow"
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
  const blogPosts = (component.blogPosts ?? []) as Record<string, unknown>[]

  if (blogPosts.length === 0) {
    return null
  }

  return (
    <section className="py-8 lg:py-16">
      <Container>
        <SectionHeader layout="left" size="sm">
          <SectionTitle size="sm" variant="inverse">
            {component.title}
          </SectionTitle>
        </SectionHeader>

        <div className="bg-strapi-gray-700/50 my-6 h-px" />

        <div className="flex flex-col gap-4">
          {blogPosts.map((post) => (
            <BlogPostLinkRow
              key={(post.documentId as string) ?? (post.id as number)}
              post={post}
              showCategory={false}
              className="rounded-lg py-3"
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
