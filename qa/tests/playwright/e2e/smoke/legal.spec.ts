import { expect, test } from "@playwright/test"

import { flattenUrls } from "../../helpers/flatten-urls"
import { LegalPage } from "../../helpers/pages/LegalPage"

import urls from "../../helpers/urls.json"

const PATHS = flattenUrls(urls.legal)

// Legal texts change, so the checks look at the amount and shape of the
// content, not at concrete wording. The shortest legal page has ~1,000 words.
const MIN_WORDS = 300
const MIN_HEADINGS = 2
const MIN_PARAGRAPHS = 5

// Template leftovers and placeholders that must never reach a legal page
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /\{\{|\}\}/,
  /\bTODO\b/,
  /\bundefined\b/,
]

// e.g. "Effective as of 7 October 2026"
const EFFECTIVE_DATE_PATTERN = /Effective as of (\d{1,2} [A-Z][a-z]+ \d{4})/

// One test per page, so each (long) page loads only once. The checks run as
// separate steps with soft assertions - all problems of a page get reported.
test.describe("Legal pages", () => {
  for (const path of PATHS) {
    test(`${path} has complete legal content`, async ({ page }) => {
      const legalPage = new LegalPage(page)
      const response = await legalPage.goTo(path)

      expect(
        response?.status(),
        `Unexpected HTTP status for ${path} (final URL: ${page.url()})`
      ).toBeLessThan(400)

      const text = await legalPage.getText()

      await test.step("has a page title", async () => {
        await expect.soft(legalPage.titleHeading).toBeVisible()
        await expect.soft(legalPage.titleHeading).toHaveText(/\S/)
      })

      await test.step("has the full legal text, split into sections", async () => {
        const wordCount = text.split(" ").length

        expect
          .soft(wordCount, `Only ${wordCount} words`)
          .toBeGreaterThanOrEqual(MIN_WORDS)
        expect
          .soft(await legalPage.headings.count(), "Too few section headings")
          .toBeGreaterThanOrEqual(MIN_HEADINGS)
        expect
          .soft(await legalPage.paragraphs.count(), "Too few paragraphs")
          .toBeGreaterThanOrEqual(MIN_PARAGRAPHS)
      })

      await test.step("has no placeholder content", async () => {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          expect.soft(text, `Placeholder ${pattern} found`).not.toMatch(pattern)
        }
      })

      await test.step("has a valid effective date, if it states one", async () => {
        const effectiveDate = EFFECTIVE_DATE_PATTERN.exec(text)?.[1]

        if (!effectiveDate) {
          return
        }

        expect
          .soft(
            Number.isNaN(Date.parse(effectiveDate)),
            `Invalid effective date "${effectiveDate}"`
          )
          .toBe(false)
      })
    })
  }
})
