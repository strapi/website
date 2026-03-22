"use client"

import { CheckCircle, Spinner } from "@phosphor-icons/react"

import { HubSpotSsrForm } from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/HubSpotSsrForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { HubSpotFormSchema } from "@/lib/hubspot"

import { useDemoRequest, type DemoResult } from "./useDemoRequest"

const DEMO_EMAIL = "admin@strapidemo.com"
const DEMO_PASSWORD = "welcomeToStrapi123"

interface DemoFormConfig {
  readonly successTitle?: string | null
  readonly successDescription?: string | null
  readonly fallbackTitle?: string | null
  readonly fallbackDescription?: string | null
}

interface DemoFormProps {
  readonly schema: HubSpotFormSchema
  readonly portalId: string
  readonly formId: string
  readonly enableRecaptcha?: boolean
  readonly config: DemoFormConfig
}

export function DemoForm({
  schema,
  portalId,
  formId,
  enableRecaptcha,
  config,
}: DemoFormProps) {
  const { stage, result, startDemoRequest } = useDemoRequest()

  if (stage === "ready" && result) {
    return (
      <DemoReadyView
        result={result}
        title={config.successTitle}
        description={config.successDescription}
      />
    )
  }

  if (stage === "fallback") {
    return (
      <DemoFallbackView
        title={config.fallbackTitle}
        description={config.fallbackDescription}
      />
    )
  }

  return (
    <div className="relative">
      {stage === "waiting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="text-strapi-blue-600 size-8 animate-spin" />
            <p className="text-strapi-neutral-600 text-sm font-medium">
              Setting up your demo...
            </p>
          </div>
        </div>
      )}

      <HubSpotSsrForm
        schema={schema}
        portalId={portalId}
        formId={formId}
        enableRecaptcha={enableRecaptcha}
        onSubmitted={(values) => {
          startDemoRequest({
            email: String(values.email ?? ""),
            firstname: String(values.firstname ?? ""),
            lastname: String(values.lastname ?? ""),
            duration: Number(values.demo_duration ?? 8),
          })
        }}
      />
    </div>
  )
}

function DemoReadyView({
  result,
  title,
  description,
}: {
  readonly result: DemoResult
  readonly title?: string | null
  readonly description?: string | null
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <CheckCircle
          className="text-strapi-green-600 mt-0.5 size-6 shrink-0"
          weight="fill"
        />
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            {title ?? "Your demo is ready!"}
          </h3>
          <p className="text-strapi-neutral-600 mt-1 text-sm">
            {description ?? "Access your hosted Strapi instance:"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <DemoLink label="Strapi Admin" href={`${result.backendUrl}/admin`} />
        <DemoLink label="Frontend" href={result.frontendUrl} />
      </div>

      <div className="bg-strapi-neutral-100 rounded-lg p-4">
        <p className="text-strapi-neutral-600 mb-2 text-xs font-medium tracking-wider uppercase">
          Credentials
        </p>
        <p className="text-foreground text-sm">
          <span className="font-medium">Email:</span> {DEMO_EMAIL}
        </p>
        <p className="text-foreground text-sm">
          <span className="font-medium">Password:</span> {DEMO_PASSWORD}
        </p>
      </div>
    </div>
  )
}

function DemoFallbackView({
  title,
  description,
}: {
  readonly title?: string | null
  readonly description?: string | null
}) {
  return (
    <Alert>
      <Spinner className="size-4 animate-spin" />
      <AlertTitle>{title ?? "Setting up your demo..."}</AlertTitle>
      <AlertDescription>
        {description ?? "You'll receive access details via email shortly."}
      </AlertDescription>
    </Alert>
  )
}

function DemoLink({
  label,
  href,
}: {
  readonly label: string
  readonly href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-strapi-neutral-200 hover:border-strapi-blue-300 hover:bg-strapi-blue-50 flex items-center justify-between rounded-lg border p-3 transition-colors"
    >
      <span className="text-foreground text-sm font-medium">{label}</span>
      <span className="text-strapi-blue-600 text-sm">{href}</span>
    </a>
  )
}
