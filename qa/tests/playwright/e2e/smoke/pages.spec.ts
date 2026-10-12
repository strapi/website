import { expect, test, type Page } from "@playwright/test"

import { flattenUrls } from "../../helpers/flatten-urls"
import { ContentPage } from "../../helpers/pages/ContentPage"

import urls from "../../helpers/urls.json"

const MAIN_PATHS = flattenUrls(urls.smoke)
const TEMPLATES = Object.entries(urls.templates).map(([name, paths]) => ({
  name,
  paths: flattenUrls(paths),
}))

// Browser errors that don't break the page, so they don't fail the test.
// They're still listed as a warning on the test in the report.
const IGNORED_PAGE_ERRORS = [
  // Hydration mismatch - React recovers by re-rendering on the client
  /Minified React error #418/,
]

async function expectPageRenders(page: Page, path: string) {
  // Uncaught exceptions in the browser (e.g. a crashing client component)
  const pageErrors: string[] = []
  page.on("pageerror", (error) => {
    if (IGNORED_PAGE_ERRORS.some((pattern) => pattern.test(error.message))) {
      test.info().annotations.push({
        type: "warning",
        description: `Ignored browser error on ${path}: ${error.message}`,
      })

      return
    }

    pageErrors.push(error.message)
  })

  const contentPage = new ContentPage(page)
  const response = await contentPage.goTo(path)

  expect(
    response?.status(),
    `Unexpected HTTP status for ${path} (final URL: ${page.url()})`
  ).toBeLessThan(400)

  await expect(contentPage.main, "Main content is missing").toBeVisible()

  expect(
    pageErrors,
    `Uncaught browser errors on ${path}:\n${pageErrors.join("\n")}`
  ).toEqual([])
}

test.describe("Main pages", () => {
  for (const path of MAIN_PATHS) {
    test(`${path} renders`, async ({ page }) => {
      await expectPageRenders(page, path)
    })
  }
})

test.describe("Template pages", () => {
  for (const { name, paths } of TEMPLATES) {
    for (const path of paths) {
      test(`${name}: ${path} renders`, async ({ page }) => {
        await expectPageRenders(page, path)
      })
    }
  }
})
