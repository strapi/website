import { NextRequest, NextResponse } from "next/server"
import { describe, expect, it, vi } from "vitest"

/*
 * navigation.ts imports next-intl/navigation, which fails to resolve in the
 * node test environment — dynamicRewrite only needs the routing config.
 */
vi.mock("@/lib/navigation", () => ({
  routing: { locales: ["en"], defaultLocale: "en" },
}))

const { dynamicRewrite } = await import("@/lib/proxies/dynamicRewrite")

const intlProxy = () => NextResponse.next()

const run = (url: string) =>
  dynamicRewrite(new NextRequest(new URL(url, "https://strapi.io")), intlProxy)

const rewriteTarget = (res: NextResponse | null): string | null =>
  res?.headers.get("x-middleware-rewrite") ?? null

describe("dynamicRewrite", () => {
  it("leaves requests without search params untouched", () => {
    expect(run("/pricing")).toBeNull()
    expect(run("/solutions/foo")).toBeNull()
  })

  it("rewrites top-level paths with search params to /dynamic", () => {
    const res = run("/pricing?utm_source=email")

    expect(rewriteTarget(res)).toBe(
      "https://strapi.io/en/dynamic/pricing?utm_source=email"
    )
  })

  it("rewrites nested paths without duplicating parent segments", () => {
    const res = run("/solutions/ecommerce-cms?utm_source=email")

    expect(rewriteTarget(res)).toBe(
      "https://strapi.io/en/dynamic/solutions/ecommerce-cms?utm_source=email"
    )
  })

  it("rewrites locale-prefixed nested paths correctly", () => {
    const res = run("/en/solutions/ecommerce-cms?x=1")

    expect(rewriteTarget(res)).toBe(
      "https://strapi.io/en/dynamic/solutions/ecommerce-cms?x=1"
    )
  })

  it("preserves the original path in the x-original-path header", () => {
    const res = run("/solutions/ecommerce-cms?x=1")

    expect(res?.headers.get("x-original-path")).toBe("/solutions/ecommerce-cms")
  })

  it("does not rewrite dedicated routes with search params", () => {
    expect(run("/blog?utm_source=email")).toBeNull()
    expect(run("/blog/some-post?_hsenc=abc&_hsmi=123")).toBeNull()
    expect(run("/en/blog/some-post?_hsenc=abc")).toBeNull()
    expect(run("/user-stories/acme?utm_source=email")).toBeNull()
    expect(run("/user/john-doe?utm_source=email")).toBeNull()
    expect(run("/headless-cms/comparison/contentful?x=1")).toBeNull()
    expect(run("/dev/component-library?x=1")).toBeNull()
  })

  it("does not double-rewrite paths already under /dynamic", () => {
    expect(run("/en/dynamic/pricing?x=1")).toBeNull()
    expect(run("/dynamic/pricing?x=1")).toBeNull()
  })

  it("does not treat dynamic-prefixed page slugs as the /dynamic segment", () => {
    const res = run("/dynamic-rendering?x=1")

    expect(rewriteTarget(res)).toBe(
      "https://strapi.io/en/dynamic/dynamic-rendering?x=1"
    )
  })

  it("blocks direct access to the bare /dynamic path", () => {
    expect(rewriteTarget(run("/dynamic"))).toBe("https://strapi.io/not-found")
    expect(rewriteTarget(run("/en/dynamic"))).toBe(
      "https://strapi.io/not-found"
    )
  })
})
