import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionDescriptionVariants = cva(
  "text-strapi-body-1 text-strapi-neutral-700 leading-relaxed",
  {
    variants: {
      variant: {
        default: "",
        inverse: "text-background/75",
        purple: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SectionDescriptionProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionDescriptionVariants> {}

export function SectionDescription({
  children,
  className,
  variant,
  ...props
}: SectionDescriptionProps) {
  if (children == null) {
    return null
  }

  return (
    <div
      data-slot="section-description"
      className={cn(sectionDescriptionVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
