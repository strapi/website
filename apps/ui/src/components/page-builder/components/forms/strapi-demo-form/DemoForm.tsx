"use client"

import { Spinner } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { HubSpotSsrForm } from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/HubSpotSsrForm"
import type { HubSpotFormSchema } from "@/lib/hubspot"

import { DemoFallbackView } from "./DemoFallbackView"
import { DemoReadyView } from "./DemoReadyView"
import { useDemoRequest } from "./useDemoRequest"

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
  const t = useTranslations("forms.demo")
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
              {t("settingUp")}
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
