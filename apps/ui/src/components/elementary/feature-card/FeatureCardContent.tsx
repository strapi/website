import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const featureCardContentVariants = cva(
  "flex flex-col items-start justify-center",
  {
    variants: {
      size: {
        sm: "gap-1 p-6 lg:p-10",
        default: "gap-2 p-8 lg:p-20",
        lg: "gap-3 p-10 lg:p-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface FeatureCardContentProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof featureCardContentVariants> {}

export function FeatureCardContent({
  size,
  className,
  children,
  ...props
}: FeatureCardContentProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="feature-card-content"
      className={cn(featureCardContentVariants({ size }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
