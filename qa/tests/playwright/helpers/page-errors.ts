import { test, type Page } from "@playwright/test"

// Browser errors that don't break the page, so they don't fail tests.
// They're still listed as a warning on the test in the report.
const IGNORED_PAGE_ERRORS = [
  // Hydration mismatch - React recovers by re-rendering on the client
  /Minified React error #418/,
]

/**
 * Collects uncaught browser errors (e.g. a crashing client component) for the
 * rest of the test. Call it before navigating. Assert on the returned array
 * once the page has loaded - it fills up as errors happen.
 */
export function collectPageErrors(page: Page) {
  const pageErrors: string[] = []

  page.on("pageerror", (error) => {
    if (IGNORED_PAGE_ERRORS.some((pattern) => pattern.test(error.message))) {
      test.info().annotations.push({
        type: "warning",
        description: `Ignored browser error on ${page.url()}: ${error.message}`,
      })

      return
    }

    pageErrors.push(error.message)
  })

  return pageErrors
}
