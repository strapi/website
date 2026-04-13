"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/styles"

export interface NewsletterFormData {
  readonly title: string
  readonly description?: string | null
  readonly emailPlaceholder?: string | null
  readonly submitLabel?: string | null
  readonly consentText?: string | null
  readonly hubspotForm?: {
    readonly portalId: string
    readonly formId: string
  } | null
}

type FormStatus = "idle" | "loading" | "success" | "error"

interface NewsletterFormProps {
  readonly data: NewsletterFormData
  readonly variant?: "dark" | "light"
  readonly layout?: "inline" | "stacked"
  readonly onSuccess?: () => void
}

export function NewsletterForm({
  data,
  variant = "dark",
  layout = "inline",
  onSuccess,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const canSubmit = data.hubspotForm?.portalId && data.hubspotForm?.formId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!canSubmit) return

    setStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch("/api/hubspot/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: data.hubspotForm!.portalId,
          formId: data.hubspotForm!.formId,
          fields: { email },
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? "Submission failed")
      }

      setStatus("success")
      setEmail("")
      onSuccess?.()
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      )
    }
  }

  const isDark = variant === "dark"

  if (status === "success") {
    return (
      <p
        className={cn(
          "text-sm font-medium",
          isDark ? "text-green-400" : "text-green-600"
        )}
      >
        Thanks for subscribing! Check your inbox to confirm.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div
        className={cn(
          "flex w-full gap-1",
          layout === "inline" ? "flex-row md:flex-col lg:flex-row" : "flex-col"
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          placeholder={data.emailPlaceholder ?? "Enter your email address"}
          className={cn(
            "h-[42px] w-full rounded-[8px] border px-4 text-sm shadow-xs outline-none",
            isDark
              ? "border-transparent bg-white text-black"
              : "border-neutral-300 bg-white text-black focus:border-blue-500"
          )}
        />
        <Button
          type="submit"
          variant="default"
          disabled={status === "loading" || !canSubmit}
          className="shrink-0"
        >
          {status === "loading"
            ? "Submitting..."
            : (data.submitLabel ?? "Subscribe")}
        </Button>
      </div>

      {status === "error" && (
        <p className={cn("text-sm", isDark ? "text-red-400" : "text-red-600")}>
          {errorMessage}
        </p>
      )}

      {data.consentText && (
        <p
          className={cn(
            "w-full text-left text-xs leading-relaxed",
            isDark ? "text-strapi-gray-400" : "text-muted-foreground"
          )}
        >
          {data.consentText}
        </p>
      )}
    </form>
  )
}
