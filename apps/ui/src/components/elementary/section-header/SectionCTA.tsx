import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionCTAVariants = cva("flex flex-wrap gap-4", {
  variants: {
    layout: {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    },
    spacing: {
      default: "mt-2",
      lg: "mt-6",
    },
  },
  defaultVariants: {
    layout: "center",
    spacing: "default",
  },
})

export interface SectionCTAProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionCTAVariants> {}

export function SectionCTA({
  layout,
  spacing,
  children,
  className,
  ...props
}: SectionCTAProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="section-cta"
      className={cn(sectionCTAVariants({ layout, spacing }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
