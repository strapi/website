import { cookies, draftMode } from "next/headers"
import { NextResponse } from "next/server"

/**
 * Exits Next.js draft mode for the current browser.
 *
 * The `/api/preview` route plants the `__prerender_bypass` cookie site-wide,
 * so an editor who opened a Strapi preview keeps seeing draft content on
 * every page until the cookie is gone. This route is the way out — it is
 * intentionally unauthenticated (disabling draft mode is always safe) and is
 * linked from the `DraftModeBanner` shown while draft mode is active.
 */
export async function GET(request: Request) {
  const dm = await draftMode()
  dm.disable()

  /**
   * Re-set the deletion with the same attributes `/api/preview` uses.
   * A partitioned cookie is only cleared by a deletion that is also
   * `SameSite=None`, `Secure`, and `Partitioned`.
   */
  const cookieStore = await cookies()
  cookieStore.set({
    name: "__prerender_bypass",
    value: "",
    expires: 0,
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "none",
    partitioned: true,
  })

  return NextResponse.redirect(resolveRedirectTarget(request))
}

/**
 * Send the editor back to the page they clicked "Exit" on. Only same-origin
 * referers are honoured so the route cannot be used as an open redirect.
 */
function resolveRedirectTarget(request: Request): URL {
  const requestUrl = new URL(request.url)
  const referer = request.headers.get("referer")

  if (referer) {
    try {
      const refererUrl = new URL(referer)

      if (refererUrl.origin === requestUrl.origin) {
        return refererUrl
      }
    } catch {
      // Malformed referer — fall through to the homepage.
    }
  }

  return new URL("/", requestUrl)
}
