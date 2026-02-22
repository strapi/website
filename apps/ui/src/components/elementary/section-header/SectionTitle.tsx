import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionTitleVariants = cva("font-bold text-foreground", {
  variants: {
    size: {
      xs: "text-2xl tracking-tight leading-tight",
      sm: "text-3xl tracking-tight leading-tight",
      default: "text-4xl tracking-tight",
      lg: "text-5xl tracking-tight leading-[1.35]",
      xl: "text-6xl tracking-tight leading-[1.4]",
    },
    variant: {
      default: "",
      inverse: "text-background",
      purple: "",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
})

export type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface SectionHeadingProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionTitleVariants> {
  readonly as?: HeadingElement
}

export function SectionTitle({
  as: Comp = "h2",
  size,
  variant,
  className,
  children,
  ...props
}: SectionHeadingProps) {
  if (!children) {
    return null
  }

  return (
    <Comp
      data-slot="section-title"
      className={cn(sectionTitleVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}
