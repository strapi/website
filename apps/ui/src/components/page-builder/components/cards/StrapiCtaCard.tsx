import type { Data } from "@repo/strapi-types"
import type { ComponentProps } from "react"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { cn } from "@/lib/styles"

interface StrapiCtaCardProps extends ComponentProps<"div"> {
  readonly component: Data.Component<"cards.cta-card">
}

/**
 * Reusable call-to-action card — title, optional image, description and one
 * link. `ctaLink` carries the internal-page vs external-URL choice, so this
 * component never needs to know which kind of destination it points at.
 */
export function StrapiCtaCard({
  component,
  className,
  ...rest
}: StrapiCtaCardProps) {
  if (!component.title || !component.ctaLink) {
    return null
  }

  const isPrimary = component.buttonStyle === "primary"

  return (
    <div
      data-slot="cta-card"
      className={cn(
        "border-strapi-neutral-150 flex flex-col gap-4 rounded-xl border bg-white p-5",
        className
      )}
      {...rest}
    >
      <h2 className="text-strapi-gray-950 text-xl leading-tight font-bold">
        {component.title}
      </h2>

      {component.image && (
        <StrapiBasicImage
          component={component.image}
          className="aspect-video w-full rounded-lg object-cover"
          sizes="(max-width: 1280px) 100vw, 320px"
        />
      )}

      {component.description && (
        <p className="text-strapi-gray-700 text-sm leading-relaxed">
          {component.description}
        </p>
      )}

      <StrapiLink
        component={component.ctaLink}
        className={cn(
          "inline-flex h-[42px] w-full items-center justify-center rounded-md px-6 text-sm font-bold transition-colors",
          isPrimary
            ? "bg-strapi-purple-600 hover:bg-strapi-purple-600/90 text-white"
            : "border-strapi-neutral-200 text-strapi-gray-950 hover:bg-strapi-neutral-100 border bg-white"
        )}
      />
    </div>
  )
}
