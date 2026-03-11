"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface UseClipOptions {
  readonly resetDelayMs?: number
}

export interface UseClipReturn {
  readonly copied: boolean
  readonly copy: (value: string | null | undefined) => Promise<boolean>
}

export function useClip({
  resetDelayMs = 2000,
}: UseClipOptions = {}): UseClipReturn {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)

  const clearCopyTimeout = useCallback(() => {
    if (timeoutRef.current === undefined) return

    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
  }, [])

  useEffect(() => clearCopyTimeout, [clearCopyTimeout])

  const copy = useCallback(
    async (value: string | null | undefined) => {
      if (!value) return false

      try {
        await navigator.clipboard.writeText(value)
        clearCopyTimeout()
        setCopied(true)

        timeoutRef.current = window.setTimeout(() => {
          setCopied(false)
          timeoutRef.current = undefined
        }, resetDelayMs)

        return true
      } catch {
        return false
      }
    },
    [clearCopyTimeout, resetDelayMs]
  )

  return { copied, copy }
}
