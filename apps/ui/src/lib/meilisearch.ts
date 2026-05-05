import "server-only"

import { Meilisearch } from "meilisearch"

let client: Meilisearch | null = null

export function getMeilisearchClient(): Meilisearch {
  if (client) return client

  const host = process.env.MEILISEARCH_HOST
  if (!host) {
    throw new Error("MEILISEARCH_HOST is not set")
  }

  client = new Meilisearch({ host, apiKey: process.env.MEILISEARCH_API_KEY })

  return client
}

export function getCaseStudiesIndexName(): string {
  return process.env.MEILISEARCH_PRODUCTION === "true"
    ? "case-studies-production"
    : "case-studies-testing"
}

export function getPagesIndexName(): string {
  return process.env.MEILISEARCH_PRODUCTION === "true"
    ? "pages-production"
    : "pages-testing"
}

export function getBlogPostsIndexName(): string {
  return process.env.MEILISEARCH_PRODUCTION === "true"
    ? "blog-posts-production"
    : "blog-posts-testing"
}
