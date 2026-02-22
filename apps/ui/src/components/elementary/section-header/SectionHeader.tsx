import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const sectionHeaderVariants = cva("flex flex-col w-full", {
  variants: {
    size: {
      xs: "gap-3 *:max-w-174",
      sm: "gap-3.5 *:max-w-174",
      default: "gap-4 *:max-w-174",
      lg: "gap-4 *:max-w-240",
      xl: "gap-5 *:max-w-240",
    },
    layout: {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    },
  },
  defaultVariants: {
    size: "default",
    layout: "center",
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
  className,
  ...props
}: SectionHeaderProps) {
  if (children == null) {
    return null
  }

  return (
    <section
      data-slot="section-header"
      className={cn(sectionHeaderVariants({ size, layout: align }), className)}
      {...props}
    >
      {children}
    </section>
  )
}
