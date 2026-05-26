"use client"

import type { Locale } from "next-intl"
import { useState, useTransition } from "react"

import { type BlogPost, getBlogPostPublishDate } from "@/lib/blog-utils"

import { loadMoreBlogPosts } from "./blog-posts-load-more"
import { BlogPostRow } from "./BlogPostRow"
import { Button } from "../ui/button"

interface BlogPostsListProps {
  readonly posts: readonly BlogPost[]
  readonly locale: Locale
  /**
   * Number of posts already consumed from Strapi (featured post + the initial
   * server-rendered list). The next "Load More" fetch starts at this offset.
   */
  readonly initialOffset: number
  readonly total: number
  readonly pageSize?: number
  readonly loadMoreLabel?: string
  readonly categorySlug?: string | readonly string[]
  readonly tagSlug?: string
}

export function BlogPostsList({
  posts: initialPosts,
  locale,
  initialOffset,
  total,
  pageSize = 10,
  loadMoreLabel = "Load More Articles",
  categorySlug,
  tagSlug,
}: BlogPostsListProps) {
  const [posts, setPosts] = useState<readonly BlogPost[]>(initialPosts)
  const [offset, setOffset] = useState(initialOffset)
  const [hasMore, setHasMore] = useState(initialOffset < total)
  const [isPending, startTransition] = useTransition()

  const handleLoadMore = () => {
    startTransition(async () => {
      const res = await loadMoreBlogPosts({
        locale,
        offset,
        limit: pageSize,
        categorySlug,
        tagSlug,
      })

      setPosts((prev) => [...prev, ...res.posts])
      setOffset((prev) => prev + res.posts.length)
      setHasMore(res.hasMore)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {posts
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
          <Button onClick={handleLoadMore} disabled={isPending}>
            {loadMoreLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
