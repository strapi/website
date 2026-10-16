import { expect, test, type Page } from "@playwright/test"

import { flattenUrls } from "../helpers/flatten-urls"
import { loadPageOnce } from "../helpers/shared-page"

import urls from "../helpers/urls.json"

const PATHS = flattenUrls(urls.seo)

// Non-production environments render noindex on purpose (see getMetaRobots in
// the UI app), so production-only checks run against these hosts only.
const PRODUCTION_HOSTNAMES = new Set(["strapi.io", "www.strapi.io"])

function isProductionBaseUrl(url: string): boolean {
  try {
    return PRODUCTION_HOSTNAMES.has(new URL(url).hostname)
  } catch {
    return false
  }
}

function normalizePath(url: string): string {
  try {
    const parsedUrl = new URL(url)

    return parsedUrl.pathname.replace(/\/$/, "") || "/"
  } catch {
    return url
  }
}

/** Expects exactly one element and returns its trimmed attribute value */
async function getSingleAttribute(page: Page, selector: string, attr: string) {
  const values = await page
    .locator(selector)
    .evaluateAll(
      (els, name) => els.map((e) => (e.getAttribute(name) ?? "").trim()),
      attr
    )

  expect(
    values.length,
    [
      `${selector} count mismatch`,
      "Expected: exactly 1",
      `Found: ${values.length}`,
      `URL: ${page.url()}`,
      `${attr} values found:`,
      ...values.map((v, i) => `  ${i + 1}. "${v}"`),
    ].join("\n")
  ).toBe(1)

  return values[0]
}

async function expectAttributeNonEmpty(
  page: Page,
  selector: string,
  attr: string
) {
  const value = await getSingleAttribute(page, selector, attr)

  expect(
    value,
    [
      `${selector} attribute is empty`,
      `Attr: ${attr}`,
      `URL: ${page.url()}`,
    ].join("\n")
  ).not.toBe("")
}

function expectLengthBetween(
  value: string,
  label: string,
  min: number,
  max: number,
  url: string
) {
  const details = [`URL: ${url}`, `Current ${label}: "${value}"`]

  expect(
    value.length,
    [`${label} is too short (min ${min} chars)`, ...details].join("\n")
  ).toBeGreaterThanOrEqual(min)
  expect(
    value.length,
    [`${label} is too long (max ${max} chars)`, ...details].join("\n")
  ).toBeLessThanOrEqual(max)
}

/**
 * Parses one JSON-LD script and returns its schemas. A @graph container has
 * no @type itself - its items have one each, so they're returned instead.
 */
function getJsonLdSchemas(content: string) {
  const data: unknown = JSON.parse(content)
  const blocks = (Array.isArray(data) ? data : [data]) as Record<
    string,
    unknown
  >[]

  return blocks.map((block) => ({
    context: block["@context"],
    schemas: Array.isArray(block["@graph"])
      ? (block["@graph"] as Record<string, unknown>[])
      : [block],
  }))
}

function getJsonLdContents(page: Page) {
  return page.locator("script[type='application/ld+json']").allTextContents()
}

// Each page loads once for all of its checks (see loadPageOnce), in one worker
test.describe.configure({ mode: "default" })

for (const path of PATHS) {
  test.describe(`SEO checks on ${path}`, () => {
    const shared = loadPageOnce(path)

    test.describe("Title", () => {
      test("should exist and be non-empty", async () => {
        const title = (await shared.page.title()).trim()

        expect(
          title,
          `Page title should not be empty\nURL: ${shared.page.url()}`
        ).not.toBe("")
      })

      test("should have reasonable length (10–70 chars)", async () => {
        const title = (await shared.page.title()).trim()

        expectLengthBetween(title, "Page title", 10, 70, shared.page.url())
      })
    })

    test.describe("Meta description", () => {
      test("should exist and be non-empty", async () => {
        await expectAttributeNonEmpty(
          shared.page,
          "meta[name='description']",
          "content"
        )
      })

      test("should have reasonable length (50–160 chars)", async () => {
        const description = await getSingleAttribute(
          shared.page,
          "meta[name='description']",
          "content"
        )

        expectLengthBetween(
          description,
          "Meta description",
          50,
          160,
          shared.page.url()
        )
      })
    })

    test.describe("Robots", () => {
      test("should not have noindex directive", async () => {
        const baseUrl = process.env.BASE_URL

        test.skip(
          !baseUrl || !isProductionBaseUrl(baseUrl),
          "Robots noindex check runs only against production (strapi.io)"
        )

        const robots = await shared.page
          .locator("meta[name='robots']")
          .evaluateAll((els) =>
            els.map((e) => (e.getAttribute("content") ?? "").toLowerCase())
          )

        for (const content of robots) {
          expect(
            content,
            [
              "robots meta must not contain noindex",
              `URL: ${shared.page.url()}`,
              `Content: "${content}"`,
            ].join("\n")
          ).not.toContain("noindex")
        }
      })
    })

    test.describe("Canonical tag", () => {
      test("should be present, absolute and reachable", async () => {
        const url = shared.page.url()
        const href = await getSingleAttribute(
          shared.page,
          "link[rel='canonical']",
          "href"
        )

        expect(
          href,
          [
            "Canonical href must be absolute",
            `URL: ${url}`,
            `Canonical href: "${href}"`,
          ].join("\n")
        ).toMatch(/^https?:\/\//)

        // The current page already loaded fine - only fetch other targets
        if (normalizePath(href) !== normalizePath(url)) {
          const response = await shared.page.request.get(href)

          expect(
            response.ok(),
            [
              "Canonical URL not reachable",
              `URL: ${url}`,
              `Canonical href: "${href}"`,
              `HTTP status: ${response.status()}`,
            ].join("\n")
          ).toBe(true)
        }
      })

      test("should self-reference the current page", async () => {
        const hasHreflang =
          (await shared.page
            .locator("link[rel='alternate'][hreflang]")
            .count()) > 0

        test.skip(
          hasHreflang,
          "Canonical self-reference skipped on multilingual pages — canonical may point to a language variant"
        )

        const url = shared.page.url()
        const href = await getSingleAttribute(
          shared.page,
          "link[rel='canonical']",
          "href"
        )

        expect(
          normalizePath(href),
          [
            "Canonical path does not match current page path",
            `URL: ${url}`,
            `Canonical: "${href}"`,
          ].join("\n")
        ).toBe(normalizePath(url))
      })
    })

    test.describe("H1 heading", () => {
      test("should exist exactly once and have non-empty text", async () => {
        const texts = (await shared.page.locator("h1").allTextContents()).map(
          (t) => t.trim()
        )

        expect(
          texts.length,
          [
            "H1 count mismatch",
            "Expected: exactly 1 <h1>",
            `Found: ${texts.length}`,
            `URL: ${shared.page.url()}`,
            "H1 texts found:",
            ...texts.map((t, i) => `  ${i + 1}. "${t}"`),
          ].join("\n")
        ).toBe(1)
        expect(
          texts[0],
          `H1 text is empty\nURL: ${shared.page.url()}`
        ).not.toBe("")
      })
    })

    test.describe("Heading hierarchy", () => {
      test("should be valid heading hierarchy", async () => {
        const headings = await shared.page
          .locator("h1, h2, h3, h4, h5, h6")
          .evaluateAll((els) =>
            els.map((el) => ({
              tag: el.tagName,
              level: Number(el.tagName[1]),
              text: (el.textContent ?? "").trim(),
            }))
          )

        for (const [i, heading] of headings.entries()) {
          const previous = headings[i - 1]

          if (!previous) {
            continue
          }

          expect(
            heading.level,
            [
              "Invalid heading hierarchy",
              `URL: ${shared.page.url()}`,
              `Index: ${i}`,
              `Current: <${heading.tag}> "${heading.text}"`,
              `Previous: <${previous.tag}> "${previous.text}"`,
              `Expected max level: H${previous.level + 1}`,
            ].join("\n")
          ).toBeLessThanOrEqual(previous.level + 1)
        }
      })
    })

    test.describe("Structured data", () => {
      test("JSON-LD should be present and valid", async () => {
        const contents = await getJsonLdContents(shared.page)

        expect(
          contents.length,
          `At least one JSON-LD script expected\nURL: ${shared.page.url()}`
        ).toBeGreaterThan(0)

        for (const [i, content] of contents.entries()) {
          expect(
            () => JSON.parse(content),
            [
              "Invalid JSON-LD",
              `URL: ${shared.page.url()}`,
              `Index: ${i}`,
              `Snippet: ${content.trim().slice(0, 200)}`,
            ].join("\n")
          ).not.toThrow()
        }
      })

      test("JSON-LD schemas should have @context and @type", async () => {
        for (const [i, content] of (
          await getJsonLdContents(shared.page)
        ).entries()) {
          for (const [j, block] of getJsonLdSchemas(content).entries()) {
            const location = `URL: ${shared.page.url()}\nScript index: ${i}, block index: ${j}`

            expect(
              block.context,
              `JSON-LD missing @context\n${location}`
            ).toBeTruthy()

            for (const [k, schema] of block.schemas.entries()) {
              expect(
                schema["@type"],
                `JSON-LD missing @type\n${location}, schema index: ${k}`
              ).toBeTruthy()
            }
          }
        }
      })

      test("JSON-LD should be present in raw HTML (not only JS-injected)", async () => {
        // The server response of the page load, before any JavaScript ran
        const html = (await shared.response?.text()) ?? ""

        expect(
          html,
          `JSON-LD not found in raw HTML — it may be injected only by JavaScript\nURL: ${shared.page.url()}`
        ).toContain('type="application/ld+json"')
      })
    })

    test.describe("Open Graph", () => {
      test("essential tags should be present and non-empty", async () => {
        for (const property of [
          "og:title",
          "og:description",
          "og:image",
          "og:url",
          "og:type",
        ]) {
          await expectAttributeNonEmpty(
            shared.page,
            `meta[property='${property}']`,
            "content"
          )
        }
      })
    })

    test.describe("hreflang", () => {
      test("hreflang tags should be valid if present", async () => {
        const url = shared.page.url()
        const entries = await shared.page
          .locator("link[rel='alternate'][hreflang]")
          .evaluateAll((links) =>
            links.map((l) => ({
              hreflang: l.getAttribute("hreflang") ?? "",
              href: l.getAttribute("href") ?? "",
            }))
          )

        if (entries.length === 0) {
          return
        }

        expect(
          entries.some(({ hreflang }) => hreflang === "x-default"),
          `x-default hreflang tag is missing\nURL: ${url}`
        ).toBe(true)

        for (const { hreflang, href } of entries) {
          expect(
            href,
            `hreflang href must be absolute\nURL: ${url}\nhreflang: "${hreflang}"`
          ).toMatch(/^https?:\/\//)
        }

        const currentPath = normalizePath(url)

        expect(
          entries.some(({ href }) => normalizePath(href) === currentPath),
          [
            "Current page path is not represented in hreflang tags",
            `URL: ${url}`,
            `Current path: "${currentPath}"`,
            "hreflang entries:",
            ...entries.map(({ hreflang, href }) => `  ${hreflang}: ${href}`),
          ].join("\n")
        ).toBe(true)
      })
    })
  })
}
