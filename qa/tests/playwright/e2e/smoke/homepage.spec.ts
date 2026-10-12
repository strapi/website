import { expect, test } from "@playwright/test"

import { HomePage } from "../../helpers/pages/HomePage"

// The main navbar and footer are checked on the homepage only - other pages
// can intentionally use a different one or none (see pages.spec.ts)
test.describe("Homepage layout", () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    await homePage.goTo()
  })

  test("shows the main navbar with links", async () => {
    await expect(homePage.navbar).toBeVisible()
    await expect(homePage.navbarLinks).not.toHaveCount(0)
  })

  test("shows the main footer", async () => {
    await expect(homePage.footer).toBeVisible()
    await expect(homePage.footer).not.toBeEmpty()
  })
})
