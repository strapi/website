// Media comes from Strapi's media storage. When it's unreachable (or assets
// get deleted), images break - but the page itself must still render and not
// crash. A failing media host isn't something a real environment produces on
// demand, so every image request is stubbed with a 404 here.
import { expect, mockTest as test } from "../../helpers/fixtures"
import { flattenUrls } from "../../helpers/flatten-urls"
import { collectPageErrors } from "../../helpers/page-errors"
import { ContentPage } from "../../helpers/pages/ContentPage"

import urls from "../../helpers/urls.json"

// Pages that render Strapi images in their main content
const PATHS = ["/", ...flattenUrls(urls.templates["user-story"])]

test.describe("Media — mocked failing asset responses", () => {
  for (const path of PATHS) {
    test(`${path} still renders when all images fail to load`, async ({
      page,
    }) => {
      const pageErrors = collectPageErrors(page)
      let stubbedImages = 0

      await page.route("**/*", (route) => {
        if (route.request().resourceType() === "image") {
          stubbedImages++

          return route.fulfill({ status: 404 })
        }

        return route.fallback()
      })

      const contentPage = new ContentPage(page)
      const response = await contentPage.goTo(path)

      expect(response?.ok()).toBe(true)
      // Makes sure the page has images at all, otherwise nothing was tested
      expect(stubbedImages, "No image requests were made").toBeGreaterThan(0)
      await expect(contentPage.main).toBeVisible()
      await expect(contentPage.main).not.toBeEmpty()
      expect(
        pageErrors,
        `Uncaught browser errors on ${path}:\n${pageErrors.join("\n")}`
      ).toEqual([])
    })
  }
})
