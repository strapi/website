import { beforeEach, describe, expect, it, vi } from "vitest"

// `content/server.ts` is server-only; stub the guard so it can load under vitest.
vi.mock("server-only", () => ({}))

vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false }),
}))

vi.mock("@/lib/strapi-api/request-auth", () => ({
  createStrapiAuthHeader: async () => ({}),
}))

vi.mock("@/lib/env-vars", () => ({
  getEnvVar: (name: string) =>
    name === "STRAPI_URL" ? "https://strapi.example.test" : undefined,
}))

// Keep the non-blocking logger quiet but observable.
const logNonBlockingError = vi.fn()
vi.mock("@/lib/logging", () => ({
  logNonBlockingError: (...args: unknown[]) => logNonBlockingError(...args),
}))

const { fetchPage } = await import("@/lib/strapi-api/content/server")

/** Strapi Cloud during the incident: HTML error page, not a JSON API response. */
const gatewayTimeoutHtml = () =>
  new Response(
    "<html><head><title>502 Bad Gateway</title></head><body>502</body></html>",
    { status: 504, headers: { "content-type": "text/html; charset=utf-8" } }
  )

/** A plain JSON 500 from Strapi itself. */
const internalServerErrorJson = () =>
  Response.json(
    { error: { name: "InternalServerError", status: 500 } },
    {
      status: 500,
      headers: { "content-type": "application/json" },
    }
  )

/** A healthy Strapi that simply has no page at that path. */
const emptyCollectionOk = () =>
  Response.json(
    { data: [], meta: { pagination: { total: 0 } } },
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  )

describe("fetchPage when Strapi is unavailable", () => {
  beforeEach(() => {
    logNonBlockingError.mockClear()
    vi.unstubAllGlobals()
  })

  it("propagates a 504 HTML gateway error instead of reporting 'no page'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gatewayTimeoutHtml())
    )

    // The render must fail so ISR serves the last good page.
    // Today this resolves to `undefined`, the caller calls notFound(),
    // and Next caches a 404 for the full revalidate window.
    await expect(fetchPage("/enterprise-terms", "en")).rejects.toThrow()
  })

  it("propagates a 500 JSON error instead of reporting 'no page'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => internalServerErrorJson())
    )

    await expect(fetchPage("/enterprise-terms", "en")).rejects.toThrow()
  })

  it("still returns empty data when Strapi is healthy and the page truly does not exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => emptyCollectionOk())
    )

    // This path MUST keep working: a real 404 has to stay a 404.
    const response = await fetchPage("/no-such-page", "en")
    expect(response?.data ?? null).toBeNull()
  })
})
