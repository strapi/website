"use server"

import * as Sentry from "@sentry/nextjs"

import type { FilterOption } from "@/components/elementary/SearchFilterSidebar"
import { getFeaturesIndexName, getMeilisearchClient } from "@/lib/meilisearch"

import type {
  FeaturePageHit,
  FeaturePagesSearchResult,
  SearchFeaturePagesArgs,
} from "./feature-pages-search-types"

const TAG_FACET = "feature_tag"

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

/**
 * Full list of feature-tag options for the sidebar, sourced from the Meilisearch
 * facet distribution (every tag present in the index, independent of the
 * currently loaded hits). Returns [] if the index is unavailable so SSG keeps working.
 */
export async function getFeatureTagFacets(): Promise<FilterOption[]> {
  const index = getMeilisearchClient().index<FeaturePageHit>(
    getFeaturesIndexName()
  )

  try {
    const res = await index.search("", { limit: 0, facets: [TAG_FACET] })
    const dist = res.facetDistribution?.[TAG_FACET] ?? {}

    return Object.keys(dist)
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({ label: tag, value: tag }))
  } catch (error) {
    console.error("[getFeatureTagFacets] Meilisearch error", error)
    Sentry.captureException(error)

    return []
  }
}

export async function searchFeaturePages({
  query,
  featureTagTitles,
  offset,
  limit,
}: SearchFeaturePagesArgs): Promise<FeaturePagesSearchResult> {
  const index = getMeilisearchClient().index<FeaturePageHit>(
    getFeaturesIndexName()
  )

  const filter: string[] = []

  if (featureTagTitles.length > 0) {
    const list = featureTagTitles.map((t) => `"${escape(t)}"`).join(", ")
    filter.push(`feature_tag IN [${list}]`)
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
