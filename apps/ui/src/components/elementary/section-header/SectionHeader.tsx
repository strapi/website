import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionHeaderVariants = cva("flex flex-col w-full", {
  variants: {
    size: {
      xs: "gap-3",
      sm: "gap-3.5",
      default: "gap-4",
      lg: "gap-4",
      xl: "gap-5",
    },
    layout: {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    },
    constrain: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      size: "xs",
      constrain: true,
      className: "*:max-w-174",
    },
    {
      size: "sm",
      constrain: true,
      className: "*:max-w-174",
    },
    {
      size: "default",
      constrain: true,
      className: "*:max-w-174",
    },
    {
      size: "lg",
      constrain: true,
      className: "*:max-w-240",
    },
    {
      size: "xl",
      constrain: true,
      className: "*:max-w-240",
    },
  ],
  defaultVariants: {
    size: "default",
    layout: "center",
    constrain: true,
  },
})

export interface SectionHeaderProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sectionHeaderVariants> {}

export function SectionHeader({
  children,
  size,
  layout: align,
  constrain,
  className,
  ...props
}: SectionHeaderProps) {
  if (children == null) {
    return null
  }

  return (
    <section
      data-slot="section-header"
      className={cn(
        sectionHeaderVariants({ size, layout: align, constrain }),
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}
