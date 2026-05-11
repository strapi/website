"use server"

import {
  DOCS_INDEX_NAME,
  getBlogPostsIndexName,
  getCaseStudiesIndexName,
  getFeaturesIndexName,
  getMeilisearchClient,
  getMeilisearchDocsClient,
  getPagesIndexName,
} from "@/lib/meilisearch"

import type {
  BlogPostGlobalHit,
  CaseStudyGlobalHit,
  DocsGlobalHit,
  FeatureGlobalHit,
  GlobalSearchResult,
  PageGlobalHit,
} from "./global-search-types"

const PER_INDEX_LIMIT = 5
const PAGES_LIMIT = 3

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
    return { caseStudies: [], pages: [], blogPosts: [], features: [], docs: [] }
  }

  const [siteRes, docsRes] = await Promise.all([
    getMeilisearchClient().multiSearch({
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
          limit: PAGES_LIMIT,
          filter: [`locale = "${escape(locale)}"`],
          attributesToRetrieve: ["slug", "title", "fullPath", "pageType"],
        },
        {
          indexUid: getBlogPostsIndexName(),
          q: trimmed,
          limit: PER_INDEX_LIMIT,
          attributesToRetrieve: ["slug", "title", "description"],
        },
        {
          indexUid: getFeaturesIndexName(),
          q: trimmed,
          limit: PER_INDEX_LIMIT,
          attributesToRetrieve: ["title", "description", "url", "feature_tag"],
        },
      ],
    }),
    getMeilisearchDocsClient()
      .index(DOCS_INDEX_NAME)
      .search(trimmed, {
        limit: PER_INDEX_LIMIT,
        attributesToRetrieve: [
          "url",
          "hierarchy_lvl0",
          "hierarchy_lvl1",
          "hierarchy_lvl2",
          "hierarchy_lvl3",
          "anchor",
        ],
      })
      .catch(() => ({ hits: [] })),
  ])

  const [caseStudies, pages, blogPosts, features] = siteRes.results

  return {
    caseStudies: (caseStudies?.hits ??
      []) as unknown as readonly CaseStudyGlobalHit[],
    pages: (pages?.hits ?? []) as unknown as readonly PageGlobalHit[],
    blogPosts: (blogPosts?.hits ??
      []) as unknown as readonly BlogPostGlobalHit[],
    features: (features?.hits ?? []) as unknown as readonly FeatureGlobalHit[],
    docs: (docsRes.hits ?? []) as unknown as readonly DocsGlobalHit[],
  }
}
