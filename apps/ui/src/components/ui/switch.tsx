"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { Switch as SwitchPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/styles"

const switchVariants = cva(
  "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        success:
          "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-neutral-300",
      },
      size: {
        xs: "h-3 w-5",
        sm: "h-3.5 w-6",
        default: "h-[1.15rem] w-8",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full ring-0 transition-transform data-[state=unchecked]:translate-x-px",
  {
    variants: {
      variant: {
        default: "bg-background",
        success: "bg-white",
      },
      size: {
        xs: "size-2.5 data-[state=checked]:translate-x-[calc(100%-2px)]",
        sm: "size-3 data-[state=checked]:translate-x-[calc(100%-2px)]",
        default: "size-4 data-[state=checked]:translate-x-[calc(100%-2px)]",
        lg: "size-5 data-[state=checked]:translate-x-[calc(100%+1px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Switch({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ variant, size, className }))}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(thumbVariants({ variant, size }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants }
