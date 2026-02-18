import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

const sectionLabelVariants = cva("typo-label", {
  variants: {
    color: {
      purple: "text-strapi-purple-600",
      green: "text-strapi-green-600",
    },
  },
  defaultVariants: {
    color: "purple",
  },
})

type SectionLabelElement = "p" | "span"

export interface SectionLabelProps
  extends
    Omit<React.HTMLAttributes<HTMLParagraphElement>, "color">,
    VariantProps<typeof sectionLabelVariants> {
  readonly as?: SectionLabelElement
}

export function SectionLabel({
  as: Comp = "p",
  color = "purple",
  className,
  ...props
}: SectionLabelProps) {
  return (
    <Comp
      data-slot="section-label"
      className={cn(sectionLabelVariants({ color }), className)}
      {...props}
    />
  )
}

export { sectionLabelVariants }
