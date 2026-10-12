import type { Locator, Page } from "@playwright/test"

export class HomePage {
  private readonly page: Page

  readonly navbar: Locator
  readonly navbarLinks: Locator
  readonly footer: Locator

  constructor(page: Page) {
    this.page = page
    // The footer has its own nested <nav>, which isn't the main navbar
    this.navbar = page.locator("nav:not(footer nav)").first()
    // Desktop and mobile navbars are both rendered, one is hidden by CSS
    this.navbarLinks = this.navbar.getByRole("link").filter({ visible: true })
    this.footer = page.getByRole("contentinfo")
  }

  async goTo() {
    const response = await this.page.goto("/", {
      waitUntil: "domcontentloaded",
    })
    await this.page.waitForLoadState("networkidle")

    return response
  }
}
