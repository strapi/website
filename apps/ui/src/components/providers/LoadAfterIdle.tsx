"use client"

import { useEffect, useState, type ReactNode } from "react"

type LoadAfterIdleProps = {
  readonly children: ReactNode
  readonly delayMs?: number
  readonly idleTimeoutMs?: number
}

export function LoadAfterIdle({
  children,
  delayMs = 0,
  idleTimeoutMs = 5000,
}: LoadAfterIdleProps) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    let timeoutId: number | undefined
    let idleId: number | undefined

    const load = () => setShouldLoad(true)

    const scheduleIdleLoad = () => {
      timeoutId = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(load, { timeout: idleTimeoutMs })
        } else {
          load()
        }
      }, delayMs)
    }

    if (document.readyState === "complete") {
      scheduleIdleLoad()
    } else {
      window.addEventListener("load", scheduleIdleLoad, { once: true })
    }

    return () => {
      window.removeEventListener("load", scheduleIdleLoad)

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [delayMs, idleTimeoutMs])

  if (!shouldLoad) {
    return null
  }

  return children
}
