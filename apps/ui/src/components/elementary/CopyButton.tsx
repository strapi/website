"use client"

import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react"

import { useClip } from "@/hooks/useClip"
import { cn } from "@/lib/styles"

interface CopyButtonProps extends React.ComponentProps<"button"> {
  readonly copyContent: string | null | undefined
  readonly copied?: boolean
  readonly copy?: (value: string | null | undefined) => Promise<boolean>
  readonly copiedLabel?: string
  readonly copyLabel?: string
  readonly iconClassName?: string
  readonly resetDelayMs?: number
}

export function CopyButton({
  copyContent,
  copied,
  copy,
  copiedLabel = "Copied",
  copyLabel = "Copy",
  iconClassName,
  resetDelayMs,
  className,
  disabled,
  type = "button",
  ...props
}: CopyButtonProps) {
  const internalClip = useClip({ resetDelayMs })
  const isCopied = copied ?? internalClip.copied
  const copyAction = copy ?? internalClip.copy

  const handleCopy = async () => {
    await copyAction(copyContent)
  }

  return (
    <button
      type={type}
      data-slot="copy-button"
      data-copied={isCopied}
      aria-label={isCopied ? copiedLabel : copyLabel}
      className={cn("inline-flex items-center justify-center", className)}
      onClick={handleCopy}
      disabled={disabled || !copyContent}
      {...props}
    >
      <span
        key={isCopied ? "copied" : "copy"}
        className="animate-spring-lg inline-flex items-center justify-center"
      >
        {isCopied ? (
          <CheckIcon className={cn("size-4", iconClassName)} weight="bold" />
        ) : (
          <CopySimpleIcon
            className={cn("size-4", iconClassName)}
            weight="regular"
          />
        )}
      </span>
    </button>
  )
}
