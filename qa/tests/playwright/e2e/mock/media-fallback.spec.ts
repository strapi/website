// Strapi media is rendered through ImageWithFallback (apps/ui), which swaps a
// failed image for FALLBACK_IMAGE_PATH. A missing or unreachable asset isn't
// something a real environment produces on demand, so it's stubbed here.
import { expect, mockTest as test } from "../../helpers/fixtures"
import {
  ContentPage,
  FALLBACK_IMAGE_PATH,
} from "../../helpers/pages/ContentPage"

// Pages that render Strapi images in their main content
const PATHS = ["/", "/user-stories/airbus"]

test.describe("Media — mocked asset responses", () => {
  for (const path of PATHS) {
    test(`${path} shows the fallback image when media fails to load`, async ({
      page,
    }) => {
      const pageErrors: string[] = []
      page.on("pageerror", (error) => pageErrors.push(error.message))

      // Every image except the fallback itself responds as a missing asset
      await page.route(
        (url) => !url.pathname.endsWith(FALLBACK_IMAGE_PATH),
        (route) => {
          if (route.request().resourceType() === "image") {
            return route.fulfill({ status: 404 })
          }

          return route.fallback()
        }
      )

      const contentPage = new ContentPage(page)
      const response = await contentPage.goTo(path)

      expect(response?.ok()).toBe(true)
      await expect(contentPage.main).toBeVisible()
      await expect(contentPage.fallbackImages.first()).toBeVisible()
      expect(
        pageErrors,
        `Uncaught browser errors on ${path}:\n${pageErrors.join("\n")}`
      ).toEqual([])
    })
  }
})
