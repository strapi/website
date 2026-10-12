import type { Locator, Page } from "@playwright/test"

import { waitForElementHydration, waitForHydration } from "../hydration"

export class PricingCmsPage {
  private readonly page: Page

  readonly growthBuyNowButton: Locator
  readonly checkoutDialog: Locator
  readonly seatCountInput: Locator
  readonly increaseSeatsButton: Locator
  readonly decreaseSeatsButton: Locator
  readonly ssoSwitch: Locator
  readonly checkoutTotal: Locator
  readonly continueButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    this.page = page

    // Growth is the only plan whose CTA opens the checkout dialog
    this.growthBuyNowButton = page
      .getByRole("main")
      .getByRole("button", { name: "Buy now", exact: true })
    this.checkoutDialog = page.getByRole("dialog", {
      name: "Add seats to your plan",
    })
    this.seatCountInput = this.checkoutDialog.getByRole("textbox", {
      name: "Number of seats",
    })
    this.increaseSeatsButton = this.checkoutDialog.getByRole("button", {
      name: "Increase seat count",
    })
    this.decreaseSeatsButton = this.checkoutDialog.getByRole("button", {
      name: "Decrease seat count",
    })
    this.ssoSwitch = this.checkoutDialog.getByRole("switch")
    // Amount next to "Total before applicable taxes", e.g. "$60/month"
    this.checkoutTotal = this.checkoutDialog
      .getByText("Total before applicable taxes", { exact: true })
      .locator("..")
      .getByText(/^\$[\d,.]+\/month$/)
    this.continueButton = this.checkoutDialog.getByRole("button", {
      name: "Continue",
      exact: true,
    })
    this.cancelButton = this.checkoutDialog.getByRole("button", {
      name: "Cancel",
      exact: true,
    })
  }

  async goTo() {
    const response = await this.page.goto("/pricing-cms", {
      waitUntil: "domcontentloaded",
    })
    // The page keeps loading in the background and never reaches
    // "networkidle" - the checkout dialog only needs the page to be hydrated
    await waitForHydration(this.page)

    return response
  }

  async openGrowthCheckout() {
    // The pricing cards hydrate later than the rest of the page
    await waitForElementHydration(this.growthBuyNowButton)
    await this.growthBuyNowButton.click()
  }

  async addSeat() {
    await this.increaseSeatsButton.click()
  }

  async removeSeat() {
    await this.decreaseSeatsButton.click()
  }

  async toggleSso() {
    await this.ssoSwitch.click()
  }

  async continueToCheckout() {
    await this.continueButton.click()
  }

  async cancelCheckout() {
    await this.cancelButton.click()
  }

  /** Monthly total in the dialog as a number, e.g. 60 for "$60/month" */
  async getCheckoutTotal() {
    const text = (await this.checkoutTotal.textContent()) ?? ""

    return Number(text.replaceAll(/[^\d.]/g, ""))
  }

  async getSeatCount() {
    return Number(await this.seatCountInput.inputValue())
  }
}
