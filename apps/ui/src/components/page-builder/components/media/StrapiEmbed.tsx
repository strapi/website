import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"

import { Container } from "@/components/elementary/Container"

export function StrapiEmbed({
  component,
}: {
  readonly component: Data.Component<"media.embed">
}) {
  const t = useTranslations("media.embed")

  if (!component.url) {
    return null
  }

  const width = component.width ?? 1000
  const height = component.height ?? 670

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div
          className="rounded-strapi-lg relative mx-auto w-full overflow-hidden"
          style={{
            maxWidth: `${width}px`,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          <iframe
            src={component.url}
            title={component.title?.trim() || t("fallbackTitle")}
            className="absolute inset-0 size-full overflow-hidden border-0"
            allow="clipboard-read; clipboard-write"
            allowFullScreen
            allowTransparency
            scrolling="no"
            loading="lazy"
            data-cookieconsent="marketing"
          />
        </div>
      </Container>
    </section>
  )
}
