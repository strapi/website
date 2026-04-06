import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

export default function BlogPostLayout({
  children,
  params,
}: LayoutProps<"/[locale]/blog/[slug]">) {
  const { locale } = use(params) as { locale: Locale }

  setRequestLocale(locale)

  return children
}
