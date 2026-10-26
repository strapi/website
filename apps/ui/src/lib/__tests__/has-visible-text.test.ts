import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SectionTitle } from "@/components/elementary/section-header/SectionTitle"
import { PricingFeatures } from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/PricingFeatures"

import { hasVisibleText } from "../has-visible-text"

describe("hasVisibleText", () => {
  it("treats empty values and whitespace-only strings as blank", () => {
    expect(hasVisibleText(null)).toBe(false)
    expect(hasVisibleText(undefined)).toBe(false)
    expect(hasVisibleText(false)).toBe(false)
    expect(hasVisibleText(true)).toBe(false)
    expect(hasVisibleText("")).toBe(false)
    expect(hasVisibleText(" ")).toBe(false)
    expect(hasVisibleText("\n\t")).toBe(false)
    expect(hasVisibleText("\u00A0")).toBe(false)
    expect(hasVisibleText([" ", "\n"])).toBe(false)
  })

  it("keeps real text, including surrounding spaces and zero", () => {
    expect(hasVisibleText(" Hello ")).toBe(true)
    expect(hasVisibleText(0)).toBe(true)
    expect(hasVisibleText([" ", "Title"])).toBe(true)
    expect(hasVisibleText(createElement("span", null, "x"))).toBe(true)
  })
})

describe("heading render guards", () => {
  it("skips a section title that is empty after trimming", () => {
    expect(renderToStaticMarkup(createElement(SectionTitle, null, " "))).toBe(
      ""
    )
    expect(renderToStaticMarkup(createElement(SectionTitle, null, ""))).toBe("")
    expect(
      renderToStaticMarkup(createElement(SectionTitle, null, "Plans"))
    ).toContain('data-slot="section-title"')
    expect(
      renderToStaticMarkup(createElement(SectionTitle, null, " Hello "))
    ).toContain(" Hello ")
  })

  it("skips a pricing feature heading that is empty after trimming", () => {
    const blank = renderToStaticMarkup(
      createElement(PricingFeatures, { title: " ", children: "SSO" })
    )
    const empty = renderToStaticMarkup(
      createElement(PricingFeatures, { title: "", children: "SSO" })
    )
    const titled = renderToStaticMarkup(
      createElement(PricingFeatures, { title: "Plans", children: "SSO" })
    )

    expect(blank).not.toContain("<h4")
    expect(blank).toContain("SSO")
    expect(empty).not.toContain("<h4")
    expect(titled).toContain("<h4")
    expect(titled).toContain("Plans")
  })
})
