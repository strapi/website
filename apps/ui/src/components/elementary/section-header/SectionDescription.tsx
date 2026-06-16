import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

export const sectionDescriptionVariants = cva(
  "text-lg leading-relaxed text-strapi-neutral-700",
  {
    variants: {
      variant: {
        default: "",
        inverse: "text-background/60",
        purple: "",
      },
      size: {
        xs: "text-sm",
        sm: "text-base",
        default: "",
        lg: "",
        xl: "text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SectionDescriptionProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionDescriptionVariants> {}

export function SectionDescription({
  children,
  className,
  variant,
  size,
  ...props
}: SectionDescriptionProps) {
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
      data-slot="section-description"
      className={cn(sectionDescriptionVariants({ variant, size }), className)}
      {...props}
    >
      {content}
    </div>
  )
}
