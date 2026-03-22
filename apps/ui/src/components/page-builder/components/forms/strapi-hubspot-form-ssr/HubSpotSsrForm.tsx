"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { WarningIcon } from "@phosphor-icons/react/ssr"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ReCaptchaProvider } from "next-recaptcha-v3"
import { useMemo } from "react"
import { useForm } from "react-hook-form"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { getEnvVar } from "@/lib/env-vars"
import type { HubSpotFormSchema, HubSpotSubmitPayload } from "@/lib/hubspot"

import {
  buildDefaultValues,
  buildSubmissionPayload,
  buildZodSchema,
} from "./helpers"
import { HubSpotConsentSection } from "./HubSpotConsentSection"
import { HubSpotField } from "./HubSpotField"

interface HubSpotSsrFormProps {
  readonly schema: HubSpotFormSchema
  readonly portalId: string
  readonly formId: string
  /** When true, obtains a reCAPTCHA v3 token before submission. Requires NEXT_PUBLIC_RECAPTCHA_SITE_KEY. */
  readonly enableRecaptcha?: boolean
  readonly onSubmitted?: (values: Record<string, unknown>) => void
}

interface SubmitPayload {
  body: HubSpotSubmitPayload
  recaptchaToken?: string
}

interface SubmitResult {
  inlineMessage?: string
}

async function submitHubSpotForm(
  payload: SubmitPayload
): Promise<SubmitResult> {
  const res = await fetch("/api/hubspot/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload.body,
      ...(payload.recaptchaToken && { recaptchaToken: payload.recaptchaToken }),
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "Submission failed")
  }

  return data
}

const recaptchaSiteKey = getEnvVar("NEXT_PUBLIC_RECAPTCHA_SITE_KEY")

/**
 * Entry point — wraps the form in ReCaptchaProvider only when captcha is
 * enabled AND the site key is configured. This avoids loading the Google
 * reCAPTCHA script on pages that don't need it.
 */
export function HubSpotSsrForm(props: HubSpotSsrFormProps) {
  if (props.enableRecaptcha && recaptchaSiteKey) {
    return (
      <ReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        <HubSpotSsrFormInner {...props} />
      </ReCaptchaProvider>
    )
  }

  return <HubSpotSsrFormInner {...props} />
}

function HubSpotSsrFormInner({
  schema,
  portalId,
  formId,
  enableRecaptcha,
  onSubmitted,
}: HubSpotSsrFormProps) {
  const t = useTranslations("forms")

  const zodSchema = useMemo(() => buildZodSchema(schema), [schema])
  const defaultValues = useMemo(() => buildDefaultValues(schema), [schema])

  const visibleFields = useMemo(
    () =>
      schema.fieldGroups.flatMap((group) =>
        group.fields.filter((field) => !field.hidden)
      ),
    [schema]
  )

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: "onBlur",
  })

  const submitMutation = useMutation({
    mutationFn: submitHubSpotForm,
    onSuccess: (data) => {
      if (onSubmitted) {
        onSubmitted(form.getValues())

        return
      }

      const postSubmitAction = schema.configuration?.postSubmitAction

      if (postSubmitAction?.type === "redirect_url" && postSubmitAction.value) {
        window.location.href = postSubmitAction.value
      }
    },
    onError: (err) => {
      form.setError("root", {
        message: err instanceof Error ? err.message : t("submissionError"),
      })
    },
  })

  const onSubmit = async (values: Record<string, unknown>) => {
    let recaptchaToken: string | undefined

    if (enableRecaptcha && recaptchaSiteKey) {
      try {
        recaptchaToken = await window.grecaptcha?.execute(recaptchaSiteKey, {
          action: "hubspot_form_submit",
        })
      } catch {
        // reCAPTCHA script not loaded — proceed without token
      }
    }

    const payload = buildSubmissionPayload({
      schema,
      values,
      formId,
      portalId,
    })

    submitMutation.mutate({ body: payload, recaptchaToken })
  }

  if (submitMutation.isSuccess && !onSubmitted) {
    const postSubmitAction = schema.configuration?.postSubmitAction
    const message =
      submitMutation.data.inlineMessage ??
      postSubmitAction?.value ??
      t("submissionSuccess")

    return (
      <div
        className="text-foreground text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: message }}
      />
    )
  }

  if (visibleFields.length === 0 && !schema.legalConsentOptions) {
    return (
      <Alert>
        <AlertTitle>{t("noFieldsTitle")}</AlertTitle>
        <AlertDescription>{t("noFieldsDescription")}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {visibleFields.map((field) => (
          <HubSpotField key={field.name} field={field} control={form.control} />
        ))}

        <HubSpotConsentSection
          legalConsentOptions={schema.legalConsentOptions}
          control={form.control}
        />

        {form.formState.submitCount > 0 &&
          Object.keys(form.formState.errors).length > 0 && (
            <div
              className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
              role="alert"
              aria-live="polite"
            >
              {t("reviewErrors")}
            </div>
          )}

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <WarningIcon className="size-4" weight="bold" />
            <AlertTitle>{t("submissionFailed")}</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={submitMutation.isPending}>
          {submitMutation.isPending
            ? t("submitting")
            : (schema.configuration?.submitButtonLabel ?? t("submitDefault"))}
        </Button>
      </form>
    </Form>
  )
}
