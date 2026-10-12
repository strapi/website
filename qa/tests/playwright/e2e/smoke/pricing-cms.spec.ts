import { expect, test } from "@playwright/test"

import { PricingCmsPage } from "../../helpers/pages/PricingCmsPage"

// Prices and included seats come from the CMS, so the tests compare totals
// with each other instead of asserting concrete amounts
test.describe("CMS pricing — Growth checkout dialog", () => {
  let pricingCmsPage: PricingCmsPage

  test.beforeEach(async ({ page, browserName }) => {
    test.slow(
      browserName === "firefox",
      "Pricing cards take ~20s to become interactive in headless Firefox"
    )

    pricingCmsPage = new PricingCmsPage(page)
    const response = await pricingCmsPage.goTo()

    expect(response?.ok()).toBe(true)

    await pricingCmsPage.openGrowthCheckout()
    await expect(pricingCmsPage.checkoutDialog).toBeVisible()
  })

  test("starts at the included seats with a monthly total", async () => {
    expect(await pricingCmsPage.getSeatCount()).toBeGreaterThanOrEqual(1)
    await expect(pricingCmsPage.decreaseSeatsButton).toBeDisabled()
    await expect(pricingCmsPage.checkoutTotal).toBeVisible()
  })

  test("updates the total when seats are added and removed", async () => {
    const includedSeats = await pricingCmsPage.getSeatCount()
    const initialTotal = await pricingCmsPage.getCheckoutTotal()

    await pricingCmsPage.addSeat()

    await expect(pricingCmsPage.seatCountInput).toHaveValue(
      String(includedSeats + 1)
    )
    await expect
      .poll(() => pricingCmsPage.getCheckoutTotal())
      .toBeGreaterThan(initialTotal)

    await pricingCmsPage.removeSeat()

    await expect(pricingCmsPage.seatCountInput).toHaveValue(
      String(includedSeats)
    )
    await expect
      .poll(() => pricingCmsPage.getCheckoutTotal())
      .toBe(initialTotal)
  })

  test("adds the SSO add-on to the total", async () => {
    const initialTotal = await pricingCmsPage.getCheckoutTotal()

    await pricingCmsPage.toggleSso()

    await expect(pricingCmsPage.ssoSwitch).toBeChecked()
    await expect
      .poll(() => pricingCmsPage.getCheckoutTotal())
      .toBeGreaterThan(initialTotal)
  })

  test("resets the selection when the dialog is cancelled", async () => {
    const includedSeats = await pricingCmsPage.getSeatCount()

    await pricingCmsPage.addSeat()
    await pricingCmsPage.cancelCheckout()

    await expect(pricingCmsPage.checkoutDialog).toBeHidden()

    await pricingCmsPage.openGrowthCheckout()

    await expect(pricingCmsPage.seatCountInput).toHaveValue(
      String(includedSeats)
    )
  })
})
