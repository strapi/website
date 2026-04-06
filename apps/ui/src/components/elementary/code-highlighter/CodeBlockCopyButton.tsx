"use client"

import { CopyButton } from "@/components/elementary/CopyButton"
import { cn } from "@/lib/styles"

interface CodeBlockCopyButtonProps {
  readonly code: string
  readonly className?: string
}

export function CodeBlockCopyButton({
  code,
  className,
}: CodeBlockCopyButtonProps) {
  return (
    <CopyButton
      copyContent={code}
      className={cn(
        "absolute top-3 right-3 z-10 cursor-pointer rounded p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
      iconClassName="size-4"
    />
  )
}
