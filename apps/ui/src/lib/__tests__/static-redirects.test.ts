import { resolveStaticRedirectDestination } from "@repo/shared-data"
import { describe, expect, it } from "vitest"

describe("resolveStaticRedirectDestination", () => {
  it("resolves exact-match sources", () => {
    expect(resolveStaticRedirectDestination("/v4")).toBe("/v5")
    expect(resolveStaticRedirectDestination("/culture")).toBe(
      "https://handbook.strapi.io/"
    )
  })

  it("ignores paths without a redirect rule", () => {
    expect(resolveStaticRedirectDestination("/pricing")).toBeNull()
    expect(resolveStaticRedirectDestination("/")).toBeNull()
  })

  it("does not treat a wildcard prefix as a substring match", () => {
    expect(resolveStaticRedirectDestination("/partnerships")).toBeNull()
  })

  it("tolerates trailing slashes", () => {
    expect(resolveStaticRedirectDestination("/partners/")).toBe(
      "https://community.strapi.io/partners"
    )
  })

  it("substitutes wildcard segments into the destination", () => {
    expect(resolveStaticRedirectDestination("/partners/gold/acme")).toBe(
      "https://community.strapi.io/gold/acme"
    )
    expect(resolveStaticRedirectDestination("/integrations/nuxtjs")).toBe(
      "https://community.strapi.io/integrations/nuxtjs"
    )
  })

  it("supports wildcard destinations without a parameter", () => {
    expect(resolveStaticRedirectDestination("/showcases/foo")).toBe(
      "https://community.strapi.io/showcases"
    )
  })

  it("collapses relative redirect chains to their final destination", () => {
    // /launch-week -> /five -> /
    expect(resolveStaticRedirectDestination("/launch-week")).toBe("/")
    expect(resolveStaticRedirectDestination("/five")).toBe("/")
  })
})
