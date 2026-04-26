"use client"

import { useState } from "react"

import { type BlogPost, getBlogPostPublishDate } from "@/lib/blog-utils"

import { BlogPostRow } from "./BlogPostRow"
import { Button } from "../ui/button"

interface BlogPostsListProps {
  readonly posts: readonly BlogPost[]
  readonly pageSize?: number
  readonly loadMoreLabel?: string
}

export function BlogPostsList({
  posts,
  pageSize = 10,
  loadMoreLabel = "Load More Articles",
}: BlogPostsListProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  return (
    <div className="flex flex-col gap-4">
      {visiblePosts
        .filter((post) => typeof post.slug === "string" && post.slug.length > 0)
        .map((post) => (
          <BlogPostRow
            key={post.documentId}
            title={post.title ?? ""}
            slug={post.slug as string}
            publishedAt={getBlogPostPublishDate(post)}
            author={post.author}
            coauthors={post.coauthors ?? undefined}
            category={post.category}
          />
        ))}

      {hasMore && (
        <div className="flex justify-center py-10">
          <Button onClick={() => setVisibleCount((c) => c + pageSize)}>
            {loadMoreLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
