"use server"

import {
  getCaseStudiesIndexName,
  getMeilisearchClient,
} from "@/lib/meilisearch"

import type {
  CaseStudiesSearchResult,
  CaseStudyHit,
  SearchCaseStudiesArgs,
} from "./case-studies-search-types"

function escape(value: string): string {
  // eslint-disable-next-line unicorn/prefer-string-raw -- escaping a single backslash in a template literal is awkward
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

export async function searchCaseStudies({
  query,
  categorySlugs,
  offset,
  limit,
}: SearchCaseStudiesArgs): Promise<CaseStudiesSearchResult> {
  const index = getMeilisearchClient().index<CaseStudyHit>(
    getCaseStudiesIndexName()
  )

  const filter: string[] = []

  if (categorySlugs.length > 0) {
    const list = categorySlugs.map((s) => `"${escape(s)}"`).join(", ")
    filter.push(`categories.slug IN [${list}]`)
  }

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
}
