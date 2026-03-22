"use client"

import { useCallback, useRef, useState } from "react"

export type DemoStage = "idle" | "waiting" | "ready" | "fallback"

export interface DemoResult {
  backendUrl: string
  frontendUrl: string
}

interface DemoRequestData {
  email: string
  firstname: string
  lastname: string
  duration: number
}

/** Manages demo provisioning lifecycle: idle → waiting → ready/fallback. Aborts in-flight requests on re-call. */
export function useDemoRequest() {
  const [stage, setStage] = useState<DemoStage>("idle")
  const [result, setResult] = useState<DemoResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startDemoRequest = useCallback(async (data: DemoRequestData) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStage("waiting")
    setResult(null)

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstname,
          lastName: data.lastname,
          duration: data.duration,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error("Demo request failed")
      }

      const responseData = await res.json()
      const links = responseData.links

      if (links?.backend && links?.frontend) {
        setResult({
          backendUrl: links.backend,
          frontendUrl: links.frontend,
        })
        setStage("ready")

        return
      }

      setStage("fallback")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setStage("fallback")
    }
  }, [])

  return { stage, result, startDemoRequest }
}
