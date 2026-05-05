"use server"

import { getMeilisearchClient, getPagesIndexName } from "@/lib/meilisearch"

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
  locale,
  query,
  offset,
  limit,
}: SearchFeaturePagesArgs): Promise<FeaturePagesSearchResult> {
  const index =
    getMeilisearchClient().index<FeaturePageHit>(getPagesIndexName())

  const filter: string[] = [
    `pageType = "feature"`,
    `locale = "${escape(locale)}"`,
  ]

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
