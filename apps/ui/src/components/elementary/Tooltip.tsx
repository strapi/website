"use client"

import { useState } from "react"

import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { InlineMarkdown } from "./markdown/InlineMarkdown"

interface Props {
  readonly children: React.ReactNode
  readonly content: string | null | undefined
  readonly contentProps?: Partial<
    React.ComponentPropsWithoutRef<typeof TooltipContent>
  >
}

export function Tooltip({ children, content, contentProps }: Props) {
  const [open, setOpen] = useState(false)

  /**
   * Radix tooltips only open on hover/focus, so they never appear on touch
   * devices. Controlling `open` lets us toggle them on tap for touch/pen while
   * leaving the hover behaviour untouched on desktop.
   */
  return (
    <TooltipProvider>
      <RadixTooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse") {
              setOpen((prev) => !prev)
            }
          }}
          onClick={(event) => {
            event.preventDefault()
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent {...contentProps}>
          <InlineMarkdown>{content}</InlineMarkdown>
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  )
}
