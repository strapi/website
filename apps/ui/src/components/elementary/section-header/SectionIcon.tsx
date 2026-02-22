import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionIconVariants = cva(
  "relative overflow-hidden [&_img]:object-contain",
  {
    variants: {
      size: {},
    },
    defaultVariants: {},
  }
)

export interface SectionIconProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionIconVariants> {}

export function SectionIcon({ size, className, ...props }: SectionIconProps) {
  return (
    <div
      data-slot="section-icon"
      className={cn(sectionIconVariants({ size }), className)}
      {...props}
    />
  )
}
