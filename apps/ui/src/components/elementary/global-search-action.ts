"use server"

import {
  getBlogPostsIndexName,
  getCaseStudiesIndexName,
  getMeilisearchClient,
  getPagesIndexName,
} from "@/lib/meilisearch"

import type {
  BlogPostGlobalHit,
  CaseStudyGlobalHit,
  GlobalSearchResult,
  PageGlobalHit,
} from "./global-search-types"

const PER_INDEX_LIMIT = 5

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

export async function globalSearch({
  query,
  locale,
}: {
  readonly query: string
  readonly locale: string
}): Promise<GlobalSearchResult> {
  const trimmed = query.trim()

  if (trimmed.length === 0) {
    return { caseStudies: [], pages: [], blogPosts: [] }
  }

  const res = await getMeilisearchClient().multiSearch({
    queries: [
      {
        indexUid: getCaseStudiesIndexName(),
        q: trimmed,
        limit: PER_INDEX_LIMIT,
        attributesToRetrieve: ["slug", "title", "companyName"],
      },
      {
        indexUid: getPagesIndexName(),
        q: trimmed,
        limit: PER_INDEX_LIMIT,
        filter: [`locale = "${escape(locale)}"`],
        attributesToRetrieve: ["slug", "title", "fullPath", "pageType"],
      },
      {
        indexUid: getBlogPostsIndexName(),
        q: trimmed,
        limit: PER_INDEX_LIMIT,
        attributesToRetrieve: ["slug", "title", "description"],
      },
    ],
  })

  const [caseStudies, pages, blogPosts] = res.results

  return {
    caseStudies: (caseStudies?.hits ??
      []) as unknown as readonly CaseStudyGlobalHit[],
    pages: (pages?.hits ?? []) as unknown as readonly PageGlobalHit[],
    blogPosts: (blogPosts?.hits ??
      []) as unknown as readonly BlogPostGlobalHit[],
  }
}
