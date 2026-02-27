import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const featureCardVariants = cva("grid items-center", {
  variants: {
    variant: {
      plain: "",
      bordered:
        "bg-strapi-blue-100 border border-strapi-blue-200 rounded-strapi-lg overflow-hidden",
    },
    layout: {
      stacked: "grid-cols-1",
      split: "grid-cols-1 lg:grid-cols-2",
    },
  },
  defaultVariants: {
    variant: "plain",
    layout: "stacked",
  },
})

export interface FeatureCardProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof featureCardVariants> {}

export function FeatureCard({
  variant,
  layout,
  className,
  children,
  ...props
}: FeatureCardProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="feature-card"
      className={cn(featureCardVariants({ variant, layout }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
