import { describe, expect, it } from "vitest"

import { resolveCDNInvalidationPaths } from "../cdn-paths"

const LOCALES = ["en"] as const

describe("resolveCDNInvalidationPaths", () => {
  it("invalidates explicit paths for a page publish, skipping the self tag", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::page.page",
        paths: ["/en/about", "/about"],
        tags: ["strapi:api::page.page"],
      },
      LOCALES
    )

    expect(paths.sort()).toEqual(["/about", "/en/about"])
  })

  it("expands blog tags to locale-aware wildcard prefixes", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::blog-post.blog-post",
        paths: ["/en/blog/my-post", "/blog/my-post"],
        tags: ["strapi:api::blog-post.blog-post"],
      },
      LOCALES
    )

    expect(paths.sort()).toEqual(["/blog*", "/en/blog*"])
  })

  it("drops explicit paths already covered by a tag wildcard", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::post-tag.post-tag",
        paths: ["/blog/tags/cms", "/en/blog/tags/cms", "/pricing"],
        tags: [
          "strapi:api::post-tag.post-tag",
          "strapi:api::blog-post.blog-post",
        ],
      },
      LOCALES
    )

    expect(paths.sort()).toEqual(["/blog*", "/en/blog*", "/pricing"])
  })

  it("escalates site-wide tags (header/footer/global) to a full purge", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::header.header",
        paths: [],
        tags: ["strapi:api::header.header"],
      },
      LOCALES
    )

    expect(paths).toEqual(["/*"])
  })

  it("escalates tag-only payloads targeting pages to a full purge", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::news-item.news-item",
        paths: [],
        tags: ["strapi:api::news-item.news-item", "strapi:api::page.page"],
      },
      LOCALES
    )

    expect(paths).toEqual(["/*"])
  })

  it("maps cms tags to the headless-cms subtree", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::cms.cms",
        paths: [],
        tags: [
          "strapi:api::cms.cms",
          "strapi:api::cms-comparison.cms-comparison",
        ],
      },
      LOCALES
    )

    expect(paths.sort()).toEqual(["/en/headless-cms*", "/headless-cms*"])
  })

  it("escalates a self tag without explicit paths to a full purge", () => {
    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::page.page",
        paths: [],
        tags: ["strapi:api::page.page"],
      },
      LOCALES
    )

    expect(paths).toEqual(["/*"])
  })

  it("collapses oversized batches into a full purge", () => {
    const manyPaths = Array.from({ length: 3500 }, (_, i) => `/page-${i}`)

    const paths = resolveCDNInvalidationPaths(
      {
        uid: "api::page.page",
        paths: manyPaths,
        tags: [],
      },
      LOCALES
    )

    expect(paths).toEqual(["/*"])
  })

  it("returns an empty list when there is nothing to purge", () => {
    const paths = resolveCDNInvalidationPaths(
      { uid: "api::page.page", paths: [], tags: [] },
      LOCALES
    )

    expect(paths).toEqual([])
  })
})
