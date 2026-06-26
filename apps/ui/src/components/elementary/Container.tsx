import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const containerVariants = cva("mx-auto", {
  variants: {
    variant: {
      default:
        "w-full max-w-312 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-0 2xl:px-0",
      hero: "w-full max-w-312 px-0 sm:px-4 md:px-10 lg:px-16 xl:px-0 2xl:px-0", // Specially padded for hero and navbar sections
      condensed:
        "w-full max-w-216 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-0 2xl:px-0",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type ContainerVariant = VariantProps<typeof containerVariants>["variant"]

export interface ContainerProps
  extends React.ComponentProps<"div">, VariantProps<typeof containerVariants> {
  readonly variant?: ContainerVariant
}

export function Container({
  className,
  variant,
  ...restProps
}: ContainerProps) {
  return (
    <div
      className={cn(containerVariants({ variant }), className)}
      {...restProps}
    />
  )
}
