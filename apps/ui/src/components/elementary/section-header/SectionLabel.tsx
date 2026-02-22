import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"
import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

export const sectionLabelVariants = cva(
  "text-sm uppercase font-bold tracking-wider flex gap-2",
  {
    variants: {
      variant: {
        default: "text-strapi-blue-600",
        inverse: "text-background",
        purple: "text-strapi-purple-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SectionLabelProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionLabelVariants> {
  readonly image?: Nullable<Data.Component<"utilities.basic-image">>
}

export function SectionLabel({
  variant,
  image,
  children,
  className,
  ...props
}: SectionLabelProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="section-label"
      className={cn(sectionLabelVariants({ variant }), className)}
      {...props}
    >
      {image && <StrapiBasicImage component={image} />}
      {children}
    </div>
  )
}
