import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

export const featureCardDescriptionVariants = cva("", {
  variants: {
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface FeatureCardDescriptionProps
  extends
    React.ComponentProps<"p">,
    VariantProps<typeof featureCardDescriptionVariants> {}

export function FeatureCardDescription({
  size = "default",
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
    <p
      className={cn(featureCardDescriptionVariants({ size }), className)}
      {...props}
    >
      {content}
    </p>
  )
}
