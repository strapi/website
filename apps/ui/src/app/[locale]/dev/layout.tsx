import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"

import { DevNavbar } from "@/app/[locale]/dev/components/DevNavbar"
import { Container } from "@/components/elementary/Container"
import { isProduction } from "@/lib/general-helpers"
import { getMetadataFromStrapi } from "@/lib/metadata"

/**
 * Dev tooling must never be indexed, regardless of APP_ENV — the env-based
 * `forbidIndexing` in build-from-seo only covers non-production.
 */
const DEV_ROBOTS: Metadata["robots"] = { index: false, follow: false }

export async function generateMetadata(
  props: LayoutProps<"/[locale]/dev">
): Promise<Metadata> {
  const { locale } = await props.params

  return (
    (await getMetadataFromStrapi({
      locale: locale as Locale,
      customMetadata: { title: "Developer tools", robots: DEV_ROBOTS },
    })) ?? { robots: DEV_ROBOTS }
  )
}

export default async function Layout({
  children,
}: LayoutProps<"/[locale]/dev">) {
  if (isProduction()) {
    notFound()
  }

  return (
    <>
      <DevNavbar />
      <Container className="py-20">{children}</Container>
    </>
  )
}
