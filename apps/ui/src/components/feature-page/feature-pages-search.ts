"use server"

import * as Sentry from "@sentry/nextjs"

import type { FilterOption } from "@/components/elementary/SearchFilterSidebar"
import { getFeaturesIndexName, getMeilisearchClient } from "@/lib/meilisearch"

import type {
  FeaturePageHit,
  FeaturePagesSearchResult,
  SearchFeaturePagesArgs,
} from "./feature-pages-search-types"

const CATEGORY_FACET = "feature_category"

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

/**
 * Full list of feature-category options for the sidebar, sourced from the Meilisearch
 * facet distribution (every category present in the index, independent of the
 * currently loaded hits). Returns [] if the index is unavailable so SSG keeps working.
 */
export async function getFeatureCategoryFacets(): Promise<FilterOption[]> {
  const index = getMeilisearchClient().index<FeaturePageHit>(
    getFeaturesIndexName()
  )

  try {
    const res = await index.search("", { limit: 0, facets: [CATEGORY_FACET] })
    const dist = res.facetDistribution?.[CATEGORY_FACET] ?? {}

    return Object.keys(dist)
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({ label: category, value: category }))
  } catch (error) {
    console.error("[getFeatureCategoryFacets] Meilisearch error", error)
    Sentry.captureException(error)

    return []
  }
}

export async function searchFeaturePages({
  query,
  featureCategoryTitles,
  offset,
  limit,
}: SearchFeaturePagesArgs): Promise<FeaturePagesSearchResult> {
  const index = getMeilisearchClient().index<FeaturePageHit>(
    getFeaturesIndexName()
  )

  const filter: string[] = []

  if (featureCategoryTitles.length > 0) {
    const list = featureCategoryTitles.map((t) => `"${escape(t)}"`).join(", ")
    filter.push(`feature_category IN [${list}]`)
  }

  // Resilient against a missing/unavailable Meilisearch index so SSG (e.g. /[locale]/features
  // via StrapiDynamicFeaturesGrid) doesn't break the build. Returns empty result and reports.
  try {
    const res = await index.search(query.trim(), {
      offset,
      limit,
      filter,
    })

    return {
      hits: res.hits,
      total: res.estimatedTotalHits ?? res.hits.length,
    }
  } catch (error) {
    console.error("[searchFeaturePages] Meilisearch error", error)
    Sentry.captureException(error)

    return { hits: [], total: 0 }
  }
}
