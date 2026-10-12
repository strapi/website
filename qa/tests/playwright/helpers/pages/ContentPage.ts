import type { Locator, Page } from "@playwright/test"

import { waitForHydration } from "../hydration"

/**
 * Any page rendered by the catch-all page route (`[[...rest]]`) from a Strapi
 * `page` entry. Main pages and template pages (blog posts, user stories, ...)
 * always render their content in <main>. The navbar and footer can differ or be
 * missing per page, so they aren't part of this object.
 */
export class ContentPage {
  private readonly page: Page

  readonly main: Locator

  constructor(page: Page) {
    this.page = page
    this.main = page.getByRole("main")
  }

  async goTo(path: string) {
    const response = await this.page.goto(path, {
      waitUntil: "domcontentloaded",
    })
    await waitForHydration(this.page)

    return response
  }
}
