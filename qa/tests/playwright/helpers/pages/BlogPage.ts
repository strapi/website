import type { Locator, Page } from "@playwright/test"

import { waitForElementHydration, waitForHydration } from "../hydration"

export class BlogPage {
  private readonly page: Page

  readonly categoryNavigation: Locator
  readonly categoryLinks: Locator
  readonly featuredPostLink: Locator
  readonly postList: Locator
  readonly postRows: Locator
  readonly loadMoreButton: Locator

  constructor(page: Page) {
    this.page = page
    const main = page.getByRole("main")

    this.categoryNavigation = main.getByRole("navigation").first()
    this.categoryLinks = this.categoryNavigation.locator(
      'a[href^="/blog/categories/"]'
    )
    // The featured post's title is the only level-2 heading linking a post
    this.featuredPostLink = main
      .getByRole("heading", { level: 2 })
      .getByRole("link")
      .first()
    // Rows have no role or test id - a row is the element whose direct child
    // is the post title link (/blog/<slug>). The featured post's link sits in
    // a heading, and category/author links go to /blog/categories/ and /user/.
    this.postRows = main.locator(
      'div:has(> a[href^="/blog/"]:not([href^="/blog/categories/"]))'
    )
    this.postList = this.postRows.first().locator("xpath=..")
    this.loadMoreButton = main.getByRole("button", {
      name: "Load More Articles",
      exact: true,
    })
  }

  async goTo() {
    const response = await this.page.goto("/blog", {
      waitUntil: "domcontentloaded",
    })
    await waitForHydration(this.page)

    return response
  }

  getPostTitleLink(postRow: Locator) {
    return postRow.locator(":scope > a")
  }

  getPostPublishDate(postRow: Locator) {
    return postRow.locator(":scope > span")
  }

  async loadMorePosts() {
    // The post list is a client component and can hydrate after the page
    await waitForElementHydration(this.loadMoreButton)
    await this.loadMoreButton.click()
  }

  async openFeaturedPost() {
    await this.featuredPostLink.click()
  }
}
