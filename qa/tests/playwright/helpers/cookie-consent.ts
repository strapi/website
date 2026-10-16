/**
 * Pre-set Cookiebot consent ("Use necessary cookies only"), so the cookie
 * banner never shows up and covers page content in tests.
 *
 * `stamp: '-1'` is a placeholder - Cookiebot doesn't need a real consent ID
 * from its server to accept the cookie.
 */
export function cookieConsentStorageState(baseUrl: string | undefined) {
  if (!baseUrl) {
    return
  }

  const { hostname, protocol } = new URL(baseUrl)
  const value = [
    "{stamp:'-1'",
    "necessary:true",
    "preferences:false",
    "statistics:false",
    "marketing:false",
    "method:'explicit'",
    "ver:2",
    `utc:${Date.now()}`,
    "region:'cz'}",
  ]
    .join(",")
    // Same encoding Cookiebot uses for the cookie value
    .replaceAll("'", "%27")
    .replaceAll(",", "%2C")

  return {
    cookies: [
      {
        name: "CookieConsent",
        value,
        domain: hostname,
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: protocol === "https:",
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  }
}
