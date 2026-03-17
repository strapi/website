import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

import { BoxPatterns } from "./BoxPatterns"

export const boxVariants = cva("relative overflow-hidden", {
  variants: {
    variant: {
      none: "",
      light: "bg-strapi-blue-100",
      dark: " bg-strapi-gray-950",
      darker: "bg-strapi-blue-900",
      darkest: "bg-strapi-gray-950",
      green: "bg-emerald-600",
    },
  },
  defaultVariants: {
    variant: "none",
  },
})

export type BoxVariant = NonNullable<
  VariantProps<typeof boxVariants>["variant"]
>

export interface BoxProps
  extends React.ComponentProps<"div">, VariantProps<typeof boxVariants> {}

export function Box({
  variant = "none",
  className,
  children,
  ...props
}: BoxProps) {
  return (
    <div className={cn(boxVariants({ variant }), className)} {...props}>
      <BoxPatterns variant={variant!} />
      {children}
    </div>
  )
}
