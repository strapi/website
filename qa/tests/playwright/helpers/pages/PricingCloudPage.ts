import type { Locator, Page } from "@playwright/test"

import { waitForElementHydration, waitForHydration } from "../hydration"

export class PricingCloudPage {
  private readonly page: Page

  readonly monthlyBillingButton: Locator
  readonly yearlyBillingButton: Locator
  readonly planSignUpLinks: Locator
  readonly yearlyBillingNotes: Locator
  readonly comparisonTable: Locator

  constructor(page: Page) {
    this.page = page
    const main = page.getByRole("main")

    // Labels can have a subtitle appended (e.g. "Yearly • save up to 17%")
    this.monthlyBillingButton = main.getByRole("button", { name: /^Monthly/ })
    this.yearlyBillingButton = main.getByRole("button", { name: /^Yearly/ })
    // Plan cards link to the Cloud sign-up with the plan preselected. Matched
    // by target, as the "Sign up" label is editable in the CMS.
    this.planSignUpLinks = main.locator(
      'a[href*="cloud.strapi.io"][href*="plan="]'
    )
    // Shown on each plan card only while yearly billing is selected, e.g.
    // "$1080 $900 billed yearly". Add-on prices also mention "billed yearly"
    // ("+$60 per environment / month, or $600 billed yearly"), hence the anchors.
    this.yearlyBillingNotes = main.getByText(/^(\$[\d,]+ )+billed yearly$/)
    this.comparisonTable = main.getByRole("table")
  }

  async goTo() {
    const response = await this.page.goto("/pricing-cloud", {
      waitUntil: "domcontentloaded",
    })
    await waitForHydration(this.page)

    return response
  }

  async selectYearlyBilling() {
    // The pricing cards hydrate later than the rest of the page
    await waitForElementHydration(this.yearlyBillingButton)
    await this.yearlyBillingButton.click()
  }

  async selectMonthlyBilling() {
    await this.monthlyBillingButton.click()
  }
}
