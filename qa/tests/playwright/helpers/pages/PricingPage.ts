import type { Locator, Page } from "@playwright/test"

export class PricingPage {
  private readonly page: Page

  readonly monthlyBillingButton: Locator
  readonly yearlyBillingButton: Locator
  readonly signUpLinks: Locator
  readonly yearlyBillingNotes: Locator
  readonly comparisonTable: Locator

  constructor(page: Page) {
    this.page = page
    const main = page.getByRole("main")

    // Labels can have a subtitle appended (e.g. "Yearly • save up to 17%")
    this.monthlyBillingButton = main.getByRole("button", { name: /^Monthly/ })
    this.yearlyBillingButton = main.getByRole("button", { name: /^Yearly/ })
    this.signUpLinks = main.getByRole("link", { name: "Sign up", exact: true })
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
    await this.page.waitForLoadState("networkidle")

    return response
  }

  async selectYearlyBilling() {
    await this.yearlyBillingButton.click()
  }

  async selectMonthlyBilling() {
    await this.monthlyBillingButton.click()
  }
}
