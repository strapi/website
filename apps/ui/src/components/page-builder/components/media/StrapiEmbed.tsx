import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

export function StrapiEmbed({
  component,
}: {
  readonly component: Data.Component<"media.embed">
}) {
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
            className="absolute inset-0 size-full overflow-hidden border-0"
            allow="clipboard-read; clipboard-write"
            allowFullScreen
            allowTransparency
            scrolling="no"
            loading="lazy"
          />
        </div>
      </Container>
    </section>
  )
}
