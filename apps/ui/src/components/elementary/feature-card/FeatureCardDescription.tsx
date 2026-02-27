import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

export const featureCardDescriptionVariants = cva(
  "text-base text-strapi-neutral-700 leading-relaxed",
  {
    variants: {
      variant: {
        default: "",
        inverse: "text-strapi-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FeatureCardDescriptionProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof featureCardDescriptionVariants> {}

export function FeatureCardDescription({
  variant,
  className,
  children,
  ...props
}: FeatureCardDescriptionProps) {
  if (children == null) {
    return null
  }

  const content =
    typeof children === "string" ? (
      <InlineMarkdown>{children}</InlineMarkdown>
    ) : (
      children
    )

  return (
    <div
      data-slot="feature-card-description"
      className={cn(featureCardDescriptionVariants({ variant }), className)}
      {...props}
    >
      {content}
    </div>
  )
}
