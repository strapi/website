import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const quoteVariants = cva("flex flex-col", {
  variants: {
    size: {
      default: "gap-8",
      lg: "gap-16",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface QuoteProps
  extends
    React.ComponentProps<"blockquote">,
    VariantProps<typeof quoteVariants> {}

export function Quote({ size, className, children, ...props }: QuoteProps) {
  if (!children) {
    return null
  }

  return (
    <blockquote
      data-slot="quote"
      className={cn(quoteVariants({ size }), className)}
      {...props}
    >
      {children}
    </blockquote>
  )
}
