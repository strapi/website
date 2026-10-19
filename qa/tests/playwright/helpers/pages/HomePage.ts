import type { Locator, Page } from "@playwright/test"

import { gotoAndWaitForHydration } from "../hydration"

export class HomePage {
  private readonly page: Page

  readonly navbar: Locator
  readonly navbarLinks: Locator
  readonly footer: Locator

  constructor(page: Page) {
    this.page = page
    // The page has several unnamed <nav> landmarks (e.g. one in the footer) -
    // the main navbar is marked with the app's own data-navbar attribute
    this.navbar = page.locator("nav[data-navbar]")
    // Desktop and mobile navbars are both rendered, one is hidden by CSS
    this.navbarLinks = this.navbar.getByRole("link").filter({ visible: true })
    this.footer = page.getByRole("contentinfo")
  }

  async goTo() {
    return gotoAndWaitForHydration(this.page, "/")
  }
}
