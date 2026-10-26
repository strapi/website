import { expect, test } from "@playwright/test"

import { BlogPage } from "../../helpers/pages/BlogPage"

// The first page loads 10 posts (featured + list). Asserting on a lower number
// and on no concrete titles keeps the test stable as new posts get published.
const MIN_VISIBLE_POSTS = 5

test.describe("Blog page", () => {
  let blogPage: BlogPage

  test.beforeEach(async ({ page }) => {
    blogPage = new BlogPage(page)
    const response = await blogPage.goTo()

    expect(response?.ok()).toBe(true)
  })

  test("shows the category navigation", async () => {
    await expect(blogPage.categoryNavigation).toBeVisible()
    await expect(blogPage.categoryLinks).not.toHaveCount(0)
  })

  test("shows the featured post", async () => {
    await expect(blogPage.featuredPostLink).toBeVisible()
    await expect(blogPage.featuredPostLink).toHaveText(/\S/)
  })

  test("shows the post list with titles and publish dates", async () => {
    await expect(blogPage.postList).toBeVisible()
    await expect
      .poll(() => blogPage.postRows.count())
      .toBeGreaterThanOrEqual(MIN_VISIBLE_POSTS)

    for (const postRow of await blogPage.postRows.all()) {
      const titleLink = blogPage.getPostTitleLink(postRow)

      await expect(titleLink).toBeVisible()
      await expect(titleLink, "Post title is empty").toHaveText(/\S/)
      await expect(titleLink).toHaveAttribute("href", /^\/blog\/[^/]+$/)
      // e.g. "October 14, 2026"
      await expect(blogPage.getPostPublishDate(postRow)).toHaveText(
        /^[A-Z][a-z]+ \d{1,2}, \d{4}$/
      )
    }
  })

  test("loads more posts", async () => {
    const initialCount = await blogPage.postRows.count()

    await blogPage.loadMorePosts()

    await expect
      .poll(() => blogPage.postRows.count())
      .toBeGreaterThan(initialCount)
  })

  test("opens the featured post", async ({ page }) => {
    const postPath = await blogPage.featuredPostLink.getAttribute("href")

    await blogPage.openFeaturedPost()

    await expect(page).toHaveURL(new RegExp(`${postPath}$`))
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })
})
