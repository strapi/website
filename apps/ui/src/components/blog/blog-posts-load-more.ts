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
}

export interface LoadMoreBlogPostsResult {
  readonly posts: BlogPost[]
  readonly hasMore: boolean
}

export async function loadMoreBlogPosts({
  locale,
  offset,
  limit,
  categorySlug,
  tagSlug,
}: LoadMoreBlogPostsArgs): Promise<LoadMoreBlogPostsResult> {
  const { posts, total } = await fetchBlogPostsPage(locale, {
    offset,
    limit,
    categorySlug,
    tagSlug,
  })

  return {
    posts,
    hasMore: offset + posts.length < total,
  }
}
