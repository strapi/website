import type { Frame, Locator, Page, Response } from "@playwright/test"

/**
 * Waits until React has hydrated the page, so client-side handlers (dialogs,
 * toggles, ...) react to clicks. React adds its internal fiber key to <body>,
 * which the app's layout renders.
 *
 * Use it instead of waiting for "networkidle" on pages that never stop
 * loading (analytics, polling, ...).
 */
export async function waitForHydration(target: Page | Frame) {
  await target.waitForFunction(() =>
    Object.keys(document.body).some((key) => key.startsWith("__reactFiber"))
  )
}

/**
 * Waits until React has attached its props (incl. event handlers) to one
 * element. Parts of a page can hydrate later than <body> - a click on them
 * before that does nothing (e.g. pricing cards in Firefox, ~3.5s later).
 */
export async function waitForElementHydration(locator: Locator) {
  const isHydrated = () =>
    locator.evaluate((element) =>
      Object.keys(element).some((key) => key.startsWith("__reactProps"))
    )

  // Re-resolves the locator on every check - React can replace the
  // server-rendered element with a new one while hydrating
  while (!(await isHydrated())) {
    await locator.page().waitForTimeout(100)
  }
}

/**
 * Navigates to `path` and waits for hydration - but only when the page loaded
 * fine. A blocked (e.g. CDN 403) or broken response has no React app, so
 * waiting would just time out and hide the real cause. The spec then fails on
 * the response status instead.
 */
export async function gotoAndWaitForHydration(
  page: Page,
  path: string
): Promise<Response | null> {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" })

  if (response?.ok()) {
    await waitForHydration(page)
  }

  return response
}
