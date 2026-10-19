// "Continue" in the Growth checkout dialog redirects to Chargebee's hosted
// checkout, with the selected plan, SSO and seats in the URL. The checkout
// page is stubbed, so no real checkout session is ever opened - the tests only
// check what the app sends to Chargebee.
import type { Page } from "@playwright/test"

import { expect, mockTest as test } from "../../helpers/fixtures"
import { PricingCmsPage } from "../../helpers/pages/PricingCmsPage"

const CHECKOUT_URL_PATTERN = /\/hosted_pages\/checkout\?/

async function stubChargebeeCheckout(page: Page) {
  await page.route(CHECKOUT_URL_PATTERN, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><h1>Stubbed Chargebee checkout</h1>",
    })
  )
}

async function continueToCheckout(page: Page, pricingCmsPage: PricingCmsPage) {
  await pricingCmsPage.continueToCheckout()
  await page.waitForURL(CHECKOUT_URL_PATTERN)

  return new URL(page.url()).searchParams
}

test.describe("CMS pricing — mocked Growth checkout", () => {
  let pricingCmsPage: PricingCmsPage

  test.beforeEach(async ({ page, browserName }) => {
    test.slow(
      browserName === "firefox",
      "Pricing cards take ~20s to become interactive in headless Firefox"
    )

    await stubChargebeeCheckout(page)

    pricingCmsPage = new PricingCmsPage(page)
    await pricingCmsPage.goTo()
    await pricingCmsPage.openGrowthCheckout()
  })

  test("redirects to the checkout with the Growth plan only", async ({
    page,
  }) => {
    const params = await continueToCheckout(page, pricingCmsPage)

    expect(params.get("layout")).toBe("full_page")
    expect(params.get("subscription_items[item_price_id][0]")).toBeTruthy()
    // Included seats only - no extra seat item
    expect(params.has("subscription_items[item_price_id][1]")).toBe(false)
  })

  test("passes the additional seats to the checkout", async ({ page }) => {
    await pricingCmsPage.addSeat()
    await pricingCmsPage.addSeat()

    const params = await continueToCheckout(page, pricingCmsPage)

    expect(params.get("subscription_items[item_price_id][1]")).toBeTruthy()
    expect(params.get("subscription_items[quantity][1]")).toBe("2")
  })

  test("uses the SSO plan price when SSO is selected", async ({ page }) => {
    const withoutSso = await continueToCheckout(page, pricingCmsPage)
    const planPriceId = withoutSso.get("subscription_items[item_price_id][0]")

    await pricingCmsPage.goTo()
    await pricingCmsPage.openGrowthCheckout()
    await pricingCmsPage.toggleSso()

    const withSso = await continueToCheckout(page, pricingCmsPage)
    const ssoPriceId = withSso.get("subscription_items[item_price_id][0]")

    expect(ssoPriceId).toBeTruthy()
    expect(ssoPriceId).not.toBe(planPriceId)
  })
})
