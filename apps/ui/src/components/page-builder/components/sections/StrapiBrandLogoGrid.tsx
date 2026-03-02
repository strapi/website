import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { SectionLabel } from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/styles"

type BrandLogoGridItem = NonNullable<
  Data.Component<"sections.brand-logo-grid">["items"]
>[number]

function LogoImage({
  item,
  variant,
}: {
  readonly item: BrandLogoGridItem
  readonly variant: string
}) {
  return (
    <StrapiBasicImage
      component={item.image}
      className={cn(
        "object-contain",
        variant === "plain"
          ? "h-[45px] w-auto opacity-50 transition-opacity hover:opacity-100"
          : "size-full"
      )}
      autoHeight
    />
  )
}

function LogoItem({
  item,
  variant,
}: {
  readonly item: BrandLogoGridItem
  readonly variant: string
}) {
  const image = <LogoImage item={item} variant={variant} />
  const linkHref = item.hasLink ? getStrapiLinkHref(item.link) : undefined

  const linkedContent = linkHref ? (
    <a
      href={linkHref}
      target={item.link?.newTab ? "_blank" : undefined}
      rel={item.link?.newTab ? "noopener noreferrer" : undefined}
      className="flex items-center justify-center"
    >
      {image}
    </a>
  ) : (
    image
  )

  const wrappedContent =
    variant === "bordered" ? (
      <div className="border-strapi-neutral-200 bg-strapi-neutral-100 flex size-20 items-center justify-center rounded-lg border p-2.5">
        {linkedContent}
      </div>
    ) : (
      <div className="flex size-[90px] items-center justify-center">
        {linkedContent}
      </div>
    )

  if (item.tooltip?.content) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{wrappedContent}</TooltipTrigger>
        <TooltipContent>{item.tooltip.content}</TooltipContent>
      </Tooltip>
    )
  }

  return wrappedContent
}

export function StrapiBrandLogoGrid({
  component,
}: {
  readonly component: Data.Component<"sections.brand-logo-grid">
}) {
  const variant = component.variant ?? "plain"

  return (
    <section className="py-16">
      <Container>
        {component.title ? (
          <SectionLabel className="mb-8 justify-center">
            {component.title}
          </SectionLabel>
        ) : null}

        <div
          className={cn(
            "flex flex-wrap items-center",
            variant === "plain"
              ? "justify-around gap-4"
              : "justify-center gap-4"
          )}
        >
          {component.items?.map((item) => (
            <LogoItem key={item.id} item={item} variant={variant} />
          ))}
        </div>
      </Container>
    </section>
  )
}
