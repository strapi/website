"use client"

import { useMutation } from "@tanstack/react-query"

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

async function requestDemo(data: DemoRequestData): Promise<DemoResult> {
  const res = await fetch("/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstname,
      lastName: data.lastname,
      duration: data.duration,
    }),
  })

  if (!res.ok) {
    throw new Error("Demo request failed")
  }

  const responseData = await res.json()
  const links = responseData.links

  if (!links?.backend || !links?.frontend) {
    throw new Error("Missing demo links in response")
  }

  return {
    backendUrl: links.backend,
    frontendUrl: links.frontend,
  }
}

/** Manages demo provisioning lifecycle via useMutation. */
export function useDemoRequest() {
  const mutation = useMutation({
    mutationFn: requestDemo,
  })

  const stage = mutation.isPending
    ? "waiting"
    : mutation.isSuccess
      ? "ready"
      : mutation.isError
        ? "fallback"
        : "idle"

  return {
    stage: stage as "idle" | "waiting" | "ready" | "fallback",
    result: mutation.data ?? null,
    startDemoRequest: mutation.mutate,
  }
}
