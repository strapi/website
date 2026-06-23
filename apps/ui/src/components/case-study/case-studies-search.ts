"use server"

import * as Sentry from "@sentry/nextjs"

import type { FilterOption } from "@/components/elementary/SearchFilterSidebar"
import {
  getCaseStudiesIndexName,
  getMeilisearchClient,
} from "@/lib/meilisearch"

import type {
  CaseStudiesSearchResult,
  CaseStudyHit,
  SearchCaseStudiesArgs,
} from "./case-studies-search-types"

const CATEGORY_FACET = "categories.name"

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

/**
 * Full list of category options for the sidebar, sourced from the Meilisearch
 * facet distribution (every category present in the index, independent of the
 * currently loaded hits). Returns [] if the index is unavailable so SSG keeps working.
 */
export async function getCaseStudyCategoryFacets(): Promise<FilterOption[]> {
  const index = getMeilisearchClient().index<CaseStudyHit>(
    getCaseStudiesIndexName()
  )

  try {
    const res = await index.search("", { limit: 0, facets: [CATEGORY_FACET] })
    const dist = res.facetDistribution?.[CATEGORY_FACET] ?? {}

    return Object.keys(dist)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }))
  } catch (error) {
    console.error("[getCaseStudyCategoryFacets] Meilisearch error", error)
    Sentry.captureException(error)

    return []
  }
}

export async function searchCaseStudies({
  query,
  categoryNames,
  offset,
  limit,
}: SearchCaseStudiesArgs): Promise<CaseStudiesSearchResult> {
  const index = getMeilisearchClient().index<CaseStudyHit>(
    getCaseStudiesIndexName()
  )

  const filter: string[] = []

  if (categoryNames.length > 0) {
    const list = categoryNames.map((s) => `"${escape(s)}"`).join(", ")
    filter.push(`${CATEGORY_FACET} IN [${list}]`)
  }

  // Resilient against a missing/unavailable Meilisearch index so SSG doesn't break the build.
  try {
    const res = await index.search(query.trim(), {
      offset,
      limit,
      filter,
      sort: ["originalPublishedAt:desc"],
    })

    return {
      hits: res.hits,
      total: res.estimatedTotalHits ?? res.hits.length,
    }
  } catch (error) {
    console.error("[searchCaseStudies] Meilisearch error", error)
    Sentry.captureException(error)

    return { hits: [], total: 0 }
  }
}
