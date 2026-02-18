import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

const sectionIconVariants = cva(
  "relative overflow-hidden [&_img]:object-contain",
  {
    variants: {
      size: {
        sm: "size-8",
        md: "size-12",
        lg: "size-16",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export type SectionIconProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof sectionIconVariants>

export function SectionIcon({ size, className, ...props }: SectionIconProps) {
  return (
    <div
      data-slot="section-icon"
      className={cn(sectionIconVariants({ size }), className)}
      {...props}
    />
  )
}

export { sectionIconVariants }
