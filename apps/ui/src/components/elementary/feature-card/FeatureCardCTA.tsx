import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const featureCardCTAVariants = cva("flex flex-wrap items-center gap-4", {
  variants: {
    spacing: {
      sm: "mt-2",
      default: "mt-5",
      lg: "mt-6",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
})

export interface FeatureCardCTAProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof featureCardCTAVariants> {}

export function FeatureCardCTA({
  spacing,
  className,
  children,
  ...props
}: FeatureCardCTAProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="feature-card-cta"
      className={cn(featureCardCTAVariants({ spacing }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
