import { expect, test } from "@playwright/test"

import { flattenUrls } from "../../helpers/flatten-urls"
import { LegalPage } from "../../helpers/pages/LegalPage"
import { loadPageOnce } from "../../helpers/shared-page"

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

// Each page loads once for all of its checks (see loadPageOnce), in one worker
test.describe.configure({ mode: "default" })

test.describe("Legal pages", () => {
  for (const path of PATHS) {
    test.describe(path, () => {
      const shared = loadPageOnce(path)
      const legalPage = () => new LegalPage(shared.page)

      test("has a page title", async () => {
        await expect(legalPage().titleHeading).toBeVisible()
        await expect(legalPage().titleHeading).toHaveText(/\S/)
      })

      test("has the full legal text, split into sections", async () => {
        const text = await legalPage().getText()
        const wordCount = text.split(" ").length

        expect(
          wordCount,
          `Only ${wordCount} words on ${path}`
        ).toBeGreaterThanOrEqual(MIN_WORDS)
        expect(await legalPage().headings.count()).toBeGreaterThanOrEqual(
          MIN_HEADINGS
        )
        expect(await legalPage().paragraphs.count()).toBeGreaterThanOrEqual(
          MIN_PARAGRAPHS
        )
      })

      test("has no placeholder content", async () => {
        const text = await legalPage().getText()

        for (const pattern of PLACEHOLDER_PATTERNS) {
          expect(text, `Placeholder ${pattern} found on ${path}`).not.toMatch(
            pattern
          )
        }
      })

      test("has a valid effective date, if it states one", async () => {
        const text = await legalPage().getText()
        const effectiveDate = EFFECTIVE_DATE_PATTERN.exec(text)?.[1]

        test.skip(!effectiveDate, `${path} doesn't state an effective date`)

        expect(
          Number.isNaN(Date.parse(effectiveDate!)),
          `Invalid effective date "${effectiveDate}" on ${path}`
        ).toBe(false)
      })
    })
  }
})
