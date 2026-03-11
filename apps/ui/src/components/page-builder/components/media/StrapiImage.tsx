import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import { formatHref, isAppLink, Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

const alignmentClasses = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const

export function StrapiImage({
  component,
}: {
  readonly component: Data.Component<"media.image">
}) {
  const alignment = component.alignment ?? "center"
  const linkHref = getStrapiLinkHref(component.link)

  const image = (
    <StrapiBasicImage
      component={component.image}
      mode="responsive"
      sizes="(max-width: 768px) 100vw, 1200px"
    />
  )

  const wrappedImage = linkHref ? (
    <ImageLink href={linkHref} newTab={component.link?.newTab ?? false}>
      {image}
    </ImageLink>
  ) : (
    image
  )

  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className={cn("flex", alignmentClasses[alignment])}>
          {wrappedImage}
        </div>
      </Container>
    </section>
  )
}

function ImageLink({
  href,
  newTab,
  children,
}: {
  readonly href: string
  readonly newTab: boolean
  readonly children: React.ReactNode
}) {
  const formattedHref = formatHref(href)

  if (isAppLink(formattedHref)) {
    return (
      <Link
        href={formattedHref}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener" : undefined}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      href={formattedHref}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  )
}
