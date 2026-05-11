"use server"

import { getFeaturesIndexName, getMeilisearchClient } from "@/lib/meilisearch"

import type {
  FeaturePageHit,
  FeaturePagesSearchResult,
  SearchFeaturePagesArgs,
} from "./feature-pages-search-types"

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
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

  const res = await index.search(query.trim(), {
    offset,
    limit,
    filter,
  })

  return {
    hits: res.hits,
    total: res.estimatedTotalHits ?? res.hits.length,
  }
}
