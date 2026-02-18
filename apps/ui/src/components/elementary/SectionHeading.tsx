import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

const sectionHeadingVariants = cva("font-bold text-foreground", {
  variants: {
    textStyle: {
      display: "text-5xl tracking-tight",
      h1: "text-strapi-header-1 tracking-tight",
      h2: "text-strapi-header-2",
      h3: "text-strapi-header-3",
      subtitle1: "text-strapi-subtitle-1",
      subtitle2: "text-strapi-subtitle-2",
    },
  },
  defaultVariants: {
    textStyle: "h2",
  },
})

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type TextStyle = NonNullable<
  VariantProps<typeof sectionHeadingVariants>["textStyle"]
>

const tagToTextStyle: Record<HeadingElement, TextStyle> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "subtitle1",
  h5: "subtitle2",
  h6: "subtitle2",
}

export interface SectionHeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof sectionHeadingVariants> {
  readonly as?: HeadingElement
}

export function SectionHeading({
  as: Comp = "h2",
  textStyle,
  className,
  ...props
}: SectionHeadingProps) {
  const resolvedTextStyle = textStyle ?? tagToTextStyle[Comp]

  return (
    <Comp
      data-slot="section-heading"
      className={cn(
        sectionHeadingVariants({ textStyle: resolvedTextStyle }),
        className
      )}
      {...props}
    />
  )
}

export { sectionHeadingVariants }
