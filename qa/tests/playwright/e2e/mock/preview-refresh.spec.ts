// The Strapi admin embeds the site in an iframe for live preview. Once
// embedded, the site announces itself with a `previewReady` message, and the
// admin posts `strapiUpdate` when content changes. StrapiPreviewListener
// (apps/ui) then calls router.refresh(), but only for messages from the
// Strapi origin.
// The admin window is stubbed with a route-fulfilled page, so no real Strapi
// admin is needed.
import type { Page, Request } from "@playwright/test"

import { expect, mockTest as test } from "../../helpers/fixtures"
import { waitForHydration } from "../../helpers/hydration"

// Must match STRAPI_URL of the app under test
const STRAPI_URL = process.env.STRAPI_URL
// Loopback, so the embedded app stays a secure context (the listener hashes
// the origin with crypto.subtle, which is missing in insecure contexts and
// would make the "ignores" test pass for the wrong reason)
const UNTRUSTED_ORIGIN = "http://127.0.0.1:4321"
const PREVIEW_PATH = "/"

// router.refresh() re-fetches the current route as an RSC payload. Prefetches
// use the same header, so they're excluded.
function isRouterRefresh(request: Request, page: Page) {
  const headers = request.headers()

  return (
    request.frame() !== page.mainFrame() &&
    headers["rsc"] === "1" &&
    !Object.keys(headers).some((name) => name.includes("prefetch"))
  )
}

async function openInAdminWindow(
  page: Page,
  adminOrigin: string,
  previewUrl: string
) {
  const adminUrl = new URL("/qa-preview-host", adminOrigin).href

  await page.route(adminUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      // Records the messages the embedded site sends to the admin window
      body: `<!doctype html>
        <script>
          window.receivedMessages = []
          window.addEventListener("message", (event) => {
            window.receivedMessages.push(event.data?.type)
          })
        </script>
        <iframe id="preview" src="${previewUrl}" style="width:1280px;height:800px;border:0"></iframe>`,
    })
  )

  await page.goto(adminUrl)
  await expect(page.frameLocator("#preview").getByRole("main")).toBeVisible()

  // The message listener is attached once the app hydrates
  const iframe = await page.locator("#preview").elementHandle()
  const frame = await iframe?.contentFrame()

  if (!frame) {
    throw new Error("Preview iframe has no frame")
  }

  await waitForHydration(frame)
}

async function postStrapiUpdate(page: Page) {
  await page.evaluate(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("#preview")
    iframe?.contentWindow?.postMessage({ type: "strapiUpdate" }, "*")
  })
}

test.describe("Strapi preview — mocked admin window", () => {
  test.skip(!STRAPI_URL, "STRAPI_URL is not set in qa/tests/playwright/.env")

  test.beforeEach(async ({ context, browserName }) => {
    // Loads the whole app inside an iframe - close to the default timeout
    // against a local dev server
    test.slow()

    // The stubbed admin page has no real address, so Chromium treats it as
    // public and blocks it from framing a local app (e.g. localhost:3000)
    if (browserName === "chromium") {
      await context.grantPermissions(["local-network-access"])
    }
  })

  test("announces itself to the Strapi admin window", async ({
    page,
    baseURL,
  }) => {
    const previewUrl = new URL(PREVIEW_PATH, baseURL).href
    await openInAdminWindow(page, new URL(STRAPI_URL!).origin, previewUrl)

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as { receivedMessages?: string[] }).receivedMessages
        )
      )
      .toContain("previewReady")
  })

  test("refreshes the page on an update message from Strapi", async ({
    page,
    baseURL,
  }) => {
    const previewUrl = new URL(PREVIEW_PATH, baseURL).href
    await openInAdminWindow(page, new URL(STRAPI_URL!).origin, previewUrl)

    const refresh = page.waitForRequest(
      (request) => isRouterRefresh(request, page),
      { timeout: 10_000 }
    )
    await postStrapiUpdate(page)

    await expect(
      refresh,
      "Page didn't refresh after a strapiUpdate message from the Strapi origin"
    ).resolves.toBeTruthy()
  })

  test("ignores update messages from other origins", async ({
    page,
    baseURL,
  }) => {
    const previewUrl = new URL(PREVIEW_PATH, baseURL).href
    await openInAdminWindow(page, UNTRUSTED_ORIGIN, previewUrl)

    const refreshes: string[] = []
    page.on("request", (request) => {
      if (isRouterRefresh(request, page)) {
        refreshes.push(request.url())
      }
    })

    await postStrapiUpdate(page)
    // Nothing to wait for when the message is ignored - give a refresh time
    // to show up before asserting there was none
    await page.waitForTimeout(3000)

    expect(refreshes).toEqual([])
  })
})
