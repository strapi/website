import type React from "react"

import { cn } from "@/lib/styles"

export interface ContainerProps extends React.ComponentProps<"div"> {
  readonly children: React.ReactNode
  readonly className?: string
  readonly hideDefaultPadding?: boolean
}

export function Container({
  children,
  className,
  hideDefaultPadding,
  ...restProps
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        hideDefaultPadding ? "max-w-screen-default" : "max-w-312 px-6",
        className
      )}
      {...restProps}
    />
  )
}
