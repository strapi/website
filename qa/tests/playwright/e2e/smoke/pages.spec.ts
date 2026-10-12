import { expect, test, type Page } from "@playwright/test"

import { flattenUrls } from "../../helpers/flatten-urls"
import { collectPageErrors } from "../../helpers/page-errors"
import { ContentPage } from "../../helpers/pages/ContentPage"

import urls from "../../helpers/urls.json"

const MAIN_PATHS = flattenUrls(urls.smoke)
const TEMPLATES = Object.entries(urls.templates).map(([name, paths]) => ({
  name,
  paths: flattenUrls(paths),
}))

async function expectPageRenders(page: Page, path: string) {
  const pageErrors = collectPageErrors(page)

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
