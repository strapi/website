import type { Locale } from "next-intl"
import { getLocale } from "next-intl/server"

import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { fetchNotFound } from "@/lib/strapi-api/content/server"
import { cn } from "@/lib/styles"

export default async function NotFound() {
  const locale = (await getLocale()) as Locale
  const notFound = (await fetchNotFound(locale))?.data

  const title = notFound?.title ?? "Page not found"
  const backButtonText = notFound?.backButtonText ?? "Back to home"
  const image = notFound?.image
  const content = notFound?.content ?? []

  return (
    <>
      <section className="py-20 lg:py-28">
        <Container>
          <SectionHeader
            size="xl"
            layout="center"
            constrain={false}
            className="gap-16"
          >
            <SectionTitle as="h1">{title}</SectionTitle>

            {image && (
              <StrapiBasicImage component={image} mode="intrinsic" priority />
            )}

            <Link
              href="/"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              {backButtonText}
            </Link>
          </SectionHeader>
        </Container>
      </section>

      {content.length > 0 && (
        <DynamicZoneRenderer content={content} surface="page" />
      )}
    </>
  )
}
