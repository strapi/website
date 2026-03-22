import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from "@/components/elementary/section-header"

export const dynamic = "force-static"

export default function BlogIndexPage(props: PageProps<"/[locale]/blog">) {
  const params = use(props.params)
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const t = use(getTranslations({ locale, namespace: "blog" }))

  return (
    <main className="py-16 lg:py-24">
      <Container>
        <SectionHeader layout="center">
          <SectionTitle as="h1" size="xl">
            {t("title")}
          </SectionTitle>
          <SectionDescription>{t("description")}</SectionDescription>
        </SectionHeader>
      </Container>
    </main>
  )
}
