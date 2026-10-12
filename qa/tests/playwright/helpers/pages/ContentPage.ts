import type { Locator, Page } from "@playwright/test"

// Must match FALLBACK_IMAGE_PATH in apps/ui/src/lib/constants.ts
export const FALLBACK_IMAGE_PATH = "/images/broken-image.png"

/**
 * Any page rendered by the catch-all page route (`[[...rest]]`) from a Strapi
 * `page` entry. Main pages and template pages (blog posts, user stories, ...)
 * always render their content in <main>. The navbar and footer can differ or be
 * missing per page, so they aren't part of this object.
 */
export class ContentPage {
  private readonly page: Page

  readonly main: Locator
  readonly fallbackImages: Locator

  constructor(page: Page) {
    this.page = page
    this.main = page.getByRole("main")
    // Images that failed to load and were swapped by ImageWithFallback
    this.fallbackImages = this.main.locator(
      `img[src*="${FALLBACK_IMAGE_PATH}"]`
    )
  }

  async goTo(path: string) {
    const response = await this.page.goto(path, {
      waitUntil: "domcontentloaded",
    })
    await this.page.waitForLoadState("networkidle")

    return response
  }
}
