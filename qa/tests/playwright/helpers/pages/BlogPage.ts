import type { Locator, Page } from "@playwright/test"

import { waitForElementHydration, gotoAndWaitForHydration } from "../hydration"

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
    // The post list is a labelled <ul>, each post is an <li>
    this.postList = main.getByRole("list", { name: "Blog posts", exact: true })
    this.postRows = this.postList.getByRole("listitem")
    this.loadMoreButton = main.getByRole("button", {
      name: "Load More Articles",
      exact: true,
    })
  }

  async goTo() {
    return gotoAndWaitForHydration(this.page, "/blog")
  }

  getPostTitleLink(postRow: Locator) {
    return postRow.locator(":scope > a")
  }

  getPostPublishDate(postRow: Locator) {
    return postRow.locator(":scope > time")
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
