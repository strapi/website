import { expect, test } from "@playwright/test"

import { PricingCloudPage } from "../../helpers/pages/PricingCloudPage"

test.describe("Cloud pricing", () => {
  let pricingCloudPage: PricingCloudPage

  test.beforeEach(async ({ page }) => {
    pricingCloudPage = new PricingCloudPage(page)
    const response = await pricingCloudPage.goTo()

    expect(response?.ok()).toBe(true)
  })

  test("shows plan cards with sign-up links", async () => {
    await expect(pricingCloudPage.planSignUpLinks).not.toHaveCount(0)

    for (const signUpLink of await pricingCloudPage.planSignUpLinks.all()) {
      await expect(signUpLink).toBeVisible()
    }
  })

  test("shows the plan comparison table", async () => {
    await expect(pricingCloudPage.comparisonTable).toBeVisible()
  })

  test("switches plan prices between yearly and monthly billing", async () => {
    await pricingCloudPage.selectYearlyBilling()
    await expect(pricingCloudPage.yearlyBillingNotes).not.toHaveCount(0)

    await pricingCloudPage.selectMonthlyBilling()
    await expect(pricingCloudPage.yearlyBillingNotes).toHaveCount(0)
  })
})
