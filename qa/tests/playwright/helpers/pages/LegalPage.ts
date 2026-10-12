import type { Locator, Page } from "@playwright/test"

/**
 * Legal pages (terms, privacy, agreements, ...): long-form text split into
 * sections. The page title is the first heading - some pages use an <h2> for
 * it, so it isn't matched by level.
 */
export class LegalPage {
  private readonly page: Page

  readonly main: Locator
  readonly titleHeading: Locator
  readonly headings: Locator
  readonly paragraphs: Locator

  constructor(page: Page) {
    this.page = page
    this.main = page.getByRole("main")
    this.titleHeading = this.main.getByRole("heading").first()
    this.headings = this.main.getByRole("heading")
    this.paragraphs = this.main.locator("p")
  }

  async goTo(path: string) {
    const response = await this.page.goto(path, {
      waitUntil: "domcontentloaded",
    })
    await this.page.waitForLoadState("networkidle")

    return response
  }

  async getText() {
    return ((await this.main.textContent()) ?? "")
      .replaceAll(/\s+/g, " ")
      .trim()
  }
}
