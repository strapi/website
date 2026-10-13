import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Response,
} from "@playwright/test"

import { waitForHydration } from "./hydration"

export interface SharedPage {
  page: Page
  response: Response | null
}

/**
 * Loads `path` once for all tests of the enclosing `test.describe`, instead of
 * once per test - for suites running many read-only checks on the same page
 * (SEO, legal). Fewer page loads are faster and keep the CDN from blocking us.
 *
 * Use with `test.describe.configure({ mode: "default" })`: the tests then run
 * in one worker one after another. A failing test doesn't stop the rest -
 * Playwright restarts the worker, which loads the page again for them.
 *
 * Contexts created here don't record traces, videos or screenshots.
 */
export function loadPageOnce(path: string): SharedPage {
  const shared = {} as SharedPage
  let context: BrowserContext | undefined

  test.beforeAll(async ({ browser }, testInfo) => {
    // The `page` fixture isn't available in beforeAll - apply the project's
    // options (baseURL, device, cookie consent, ...) to the context manually
    const {
      baseURL,
      storageState,
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      locale,
    } = testInfo.project.use

    context = await browser.newContext({
      baseURL,
      storageState,
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
      locale,
    })
    shared.page = await context.newPage()
    shared.response = await shared.page.goto(path, {
      waitUntil: "domcontentloaded",
    })

    // A blocked or broken response would make every check report misleading
    // errors - fail all tests of the group with the real reason instead
    expect(
      shared.response?.status(),
      `Unexpected HTTP status for ${path} (final URL: ${shared.page.url()})`
    ).toBeLessThan(400)

    await waitForHydration(shared.page)
  })

  test.afterAll(async () => {
    await context?.close()
  })

  return shared
}
