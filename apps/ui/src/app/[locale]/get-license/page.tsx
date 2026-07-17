import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { MinimalHeader } from "@/components/layouts/MinimalHeader"
import { GetLicenseView } from "@/components/license-key/GetLicenseView"

/*
 * Query-param driven (?token=...), so rendered at request time and exempted
 * from the query-param rewrite in `dynamicRewrite` (see
 * `dedicatedRouteSegments`).
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Get license",

  // One-time license reveal carrying access tokens — never index it.
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Standalone license-reveal page (no site navigation/footer), ported from
 * website-2020 `pages/get-license.js`. Reached from /order-confirmation or
 * from the license link in the confirmation email; the actual fetch happens
 * client-side in {@link GetLicenseView} because the registry invalidates the
 * token on read.
 */
export default function GetLicensePage(
  props: PageProps<"/[locale]/get-license">
) {
  const { locale } = use(props.params) as { locale: Locale }
  setRequestLocale(locale)

  const query = use(props.searchParams)
  const token = Array.isArray(query.token) ? query.token[0] : query.token

  return (
    <div className="flex w-full flex-col">
      <div data-minimal-layout hidden />
      <MinimalHeader />

      <main>
        <Container>
          <GetLicenseView token={token} />
        </Container>
      </main>
    </div>
  )
}
