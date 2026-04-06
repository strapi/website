"use client"

import { useState } from "react"

import type { AuthorAvatarData } from "@/components/elementary/AuthorAvatars"
import type { BlogCategory } from "@/lib/blog-utils"

import { BlogPostRow } from "./BlogPostRow"
import { Button } from "../ui/button"

interface BlogPost {
  readonly id: number
  readonly documentId: string
  readonly title: string
  readonly slug: string
  readonly publishedAt: string | null
  readonly author?: AuthorAvatarData | null
  readonly coauthors?: readonly AuthorAvatarData[]
  readonly category?: BlogCategory | null
}

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
      {visiblePosts.map((post) => (
        <BlogPostRow
          key={post.documentId}
          title={post.title}
          slug={post.slug}
          publishedAt={post.publishedAt}
          author={post.author}
          coauthors={post.coauthors}
          category={post.category}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center py-6">
          <Button onClick={() => setVisibleCount((c) => c + pageSize)}>
            {loadMoreLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
