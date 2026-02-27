import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const featureCardTitleVariants = cva(
  "text-2xl font-bold tracking-tight leading-snug",
  {
    variants: {
      variant: {
        default: "text-foreground",
        inverse: "text-background",
        muted: "text-strapi-neutral-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FeatureCardTitleProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof featureCardTitleVariants> {
  readonly as?: "h2" | "h3" | "h4" | "h5" | "h6" | "p"
  readonly icon?: React.ReactNode
}

export function FeatureCardTitle({
  as: Comp = "h3",
  variant,
  icon,
  className,
  children,
  ...props
}: FeatureCardTitleProps) {
  if (!children) {
    return null
  }

  if (icon) {
    return (
      <div data-slot="feature-card-title" className="flex items-start gap-3">
        <div className="mt-1 shrink-0">{icon}</div>
        <Comp
          className={cn(featureCardTitleVariants({ variant }), className)}
          {...props}
        >
          {children}
        </Comp>
      </div>
    )
  }

  return (
    <Comp
      data-slot="feature-card-title"
      className={cn(featureCardTitleVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}
