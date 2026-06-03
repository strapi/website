import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

export const quoteTextVariants = cva("italic text-foreground leading-relaxed", {
  variants: {
    size: {
      default: "text-xl",
      lg: "text-2xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface QuoteTextProps
  extends React.ComponentProps<"div">, VariantProps<typeof quoteTextVariants> {}

export function QuoteText({
  size,
  className,
  children,
  ...props
}: QuoteTextProps) {
  if (!children) {
    return null
  }

  const content =
    typeof children === "string" ? (
      <InlineMarkdown allowNewLines>{children}</InlineMarkdown>
    ) : (
      children
    )

  return (
    <div
      data-slot="quote-text"
      className={cn(quoteTextVariants({ size }), className)}
      {...props}
    >
      {content}
    </div>
  )
}
