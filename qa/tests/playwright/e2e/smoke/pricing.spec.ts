import { expect, test } from "@playwright/test"

import { PricingPage } from "../../helpers/pages/PricingPage"

test.describe("Pricing page", () => {
  let pricingPage: PricingPage

  test.beforeEach(async ({ page }) => {
    pricingPage = new PricingPage(page)
    const response = await pricingPage.goTo()

    expect(response?.ok()).toBe(true)
  })

  test("shows plan cards with sign-up links", async () => {
    await expect(pricingPage.signUpLinks.first()).toBeVisible()
  })

  test("shows the plan comparison table", async () => {
    await expect(pricingPage.comparisonTable).toBeVisible()
  })

  test("switches plan prices between yearly and monthly billing", async () => {
    await pricingPage.selectYearlyBilling()
    await expect(pricingPage.yearlyBillingNotes.first()).toBeVisible()

    await pricingPage.selectMonthlyBilling()
    await expect(pricingPage.yearlyBillingNotes).toHaveCount(0)
  })
})
