"use server"

import type { Locale } from "next-intl"

import type { BlogPost } from "@/lib/blog-utils"
import { fetchBlogPostsPage } from "@/lib/strapi-api/content/server"

export interface LoadMoreBlogPostsArgs {
  readonly locale: Locale
  readonly offset: number
  readonly limit: number
  readonly categorySlug?: string | readonly string[]
  readonly tagSlug?: string
  readonly authorSlug?: string
  readonly excludeCategorySlugs?: readonly string[]
  readonly excludeSlugs?: readonly string[]
}

export interface LoadMoreBlogPostsResult {
  readonly posts: BlogPost[]
  readonly fetchedCount: number
  readonly hasMore: boolean
}

export async function loadMoreBlogPosts({
  locale,
  offset,
  limit,
  categorySlug,
  tagSlug,
  authorSlug,
  excludeCategorySlugs,
  excludeSlugs,
}: LoadMoreBlogPostsArgs): Promise<LoadMoreBlogPostsResult> {
  const { posts, total } = await fetchBlogPostsPage(locale, {
    offset,
    limit,
    categorySlug,
    tagSlug,
    authorSlug,
    excludeCategorySlugs,
  })

  const excluded = new Set(excludeSlugs)
  const filteredPosts =
    excluded.size === 0
      ? posts
      : posts.filter((post) => !excluded.has(post.slug as string))

  return {
    posts: filteredPosts,
    fetchedCount: posts.length,
    hasMore: offset + posts.length < total,
  }
}
