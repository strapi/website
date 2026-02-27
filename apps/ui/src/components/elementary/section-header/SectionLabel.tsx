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
        inverse: "text-strapi-purple-500",
        purple: "text-strapi-purple-600",
      },
      size: {
        xs: "text-xs",
        sm: "text-xs",
        default: "",
        lg: "text-base",
        xl: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
  size,
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
      className={cn(sectionLabelVariants({ variant, size }), className)}
      {...props}
    >
      {image && <StrapiBasicImage component={image} />}
      {children}
    </div>
  )
}
