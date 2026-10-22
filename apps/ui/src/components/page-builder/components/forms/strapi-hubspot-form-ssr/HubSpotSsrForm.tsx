"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { WarningIcon } from "@phosphor-icons/react/ssr"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useMemo, type ReactNode } from "react"
import { useForm } from "react-hook-form"

import { SectionTitle } from "@/components/elementary/section-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { getEnvVar } from "@/lib/env-vars"
import type { HubSpotFormSchema, HubSpotSubmitPayload } from "@/lib/hubspot"

import { DeferredReCaptchaProvider } from "./DeferredReCaptchaProvider"
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
  /** Optional heading rendered above the form. Omitted when absent. */
  readonly title?: string | null
  /**
   * Server-rendered content shown in place of the form after a successful
   * submission. Takes precedence over HubSpot's `inlineMessage`, which is
   * empty for forms built in the HubSpot new editor.
   */
  readonly thankYouContent?: ReactNode
}

interface SubmitPayload {
  body: HubSpotSubmitPayload
  recaptchaToken?: string
}

interface SubmitResult {
  inlineMessage?: string
  redirectUri?: string
}

interface SubmitFieldError {
  code: string
  message: string
  field?: string
}

/** Error thrown by the submit call, carrying HubSpot's per-field reasons when available. */
class SubmitError extends Error {
  readonly fieldErrors: SubmitFieldError[]

  constructor(message: string, fieldErrors: SubmitFieldError[] = []) {
    super(message)
    this.name = "SubmitError"
    this.fieldErrors = fieldErrors
  }
}

/** Returns the trimmed string, or undefined when empty or not a string. */
function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
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

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new SubmitError(
      data.error || "Submission failed",
      Array.isArray(data.errors) ? data.errors : []
    )
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
      <DeferredReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        <HubSpotSsrFormInner {...props} />
      </DeferredReCaptchaProvider>
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
  title,
  thankYouContent,
}: HubSpotSsrFormProps) {
  const t = useTranslations("forms")

  const messageForErrorCode = (code: string): string => {
    switch (code) {
      case "BLOCKED_EMAIL":
        return t("errors.blockedEmail")
      case "INVALID_EMAIL":
        return t("errors.invalidEmail")
      case "REQUIRED_FIELD":
        return t("errors.requiredField")

      default:
        return t("errors.invalidValue")
    }
  }

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

      // HubSpot may answer with a redirect target; honour it first.
      const redirectUri = nonEmpty(data.redirectUri)

      if (redirectUri) {
        window.location.href = redirectUri

        return
      }

      const postSubmitAction = schema.configuration?.postSubmitAction

      if (
        postSubmitAction?.type === "redirect_url" &&
        nonEmpty(postSubmitAction.value)
      ) {
        window.location.href = postSubmitAction.value as string
      }
    },
    onError: (err) => {
      const fieldErrors = err instanceof SubmitError ? err.fieldErrors : []
      let shownInline = false

      // Attach HubSpot's reasons to the fields they concern, with a readable
      // message per error code; anything unmapped falls back to the banner.
      for (const fieldError of fieldErrors) {
        const fieldName = fieldError.field

        if (!fieldName || !visibleFields.some((f) => f.name === fieldName)) {
          continue
        }

        form.setError(fieldName, {
          type: "server",
          message: messageForErrorCode(fieldError.code),
        })
        shownInline = true
      }

      if (shownInline) {
        return
      }

      // No field to attach the error to: show the most useful message we have.
      let rootMessage =
        err instanceof Error ? err.message : t("submissionError")

      if (fieldErrors[0]) {
        rootMessage = messageForErrorCode(fieldErrors[0].code)
      }

      form.setError("root", { message: rootMessage })
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
    // 1. CMS-managed thank-you block (preferred: works for every HubSpot form,
    //    including new-editor forms whose inlineMessage comes back empty).
    if (thankYouContent) {
      return <>{thankYouContent}</>
    }

    // 2. HubSpot-provided HTML, skipping empty strings so the fallback below
    //    always applies (`??` alone would render a blank box for "").
    const postSubmitAction = schema.configuration?.postSubmitAction
    const message =
      nonEmpty(submitMutation.data.inlineMessage) ??
      (postSubmitAction?.type !== "redirect_url"
        ? nonEmpty(postSubmitAction?.value)
        : undefined)

    if (message) {
      return (
        <div
          className="text-foreground text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )
    }

    // 3. Generic, translated fallback.
    return (
      <p className="text-foreground text-sm leading-relaxed" role="status">
        {t("submissionSuccess")}
      </p>
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
    <>
      <SectionTitle as="h2" size="sm" className="mb-6">
        {title}
      </SectionTitle>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          {visibleFields.map((field) => (
            <HubSpotField
              key={field.name}
              field={field}
              control={form.control}
            />
          ))}

          <HubSpotConsentSection
            legalConsentOptions={schema.legalConsentOptions}
            control={form.control}
          />

          {form.formState.submitCount > 0 &&
            Object.keys(form.formState.errors).some(
              (key) => key !== "root"
            ) && (
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
    </>
  )
}
