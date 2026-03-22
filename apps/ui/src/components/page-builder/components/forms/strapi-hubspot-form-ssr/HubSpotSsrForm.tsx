"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { WarningIcon } from "@phosphor-icons/react/ssr"
import { ReCaptchaProvider } from "next-recaptcha-v3"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { getEnvVar } from "@/lib/env-vars"
import type { HubSpotFormSchema } from "@/lib/hubspot"

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
  const [submitted, setSubmitted] = useState<{
    message: string
  } | null>(null)

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

  const { setError } = form

  const onSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        // Obtain reCAPTCHA token when enabled (silently skipped if provider is missing)
        let recaptchaToken: string | undefined
        if (enableRecaptcha && recaptchaSiteKey) {
          try {
            recaptchaToken = await window.grecaptcha?.execute(
              recaptchaSiteKey,
              {
                action: "hubspot_form_submit",
              }
            )
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

        const res = await fetch("/api/hubspot/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ...(recaptchaToken && { recaptchaToken }),
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Submission failed")
        }

        // If parent provided onSubmitted, delegate post-submit handling
        if (onSubmitted) {
          onSubmitted(values)

          return
        }

        const postSubmitAction = schema.configuration?.postSubmitAction

        if (
          postSubmitAction?.type === "redirect_url" &&
          postSubmitAction.value
        ) {
          window.location.href = postSubmitAction.value

          return
        }

        setSubmitted({
          message:
            data.inlineMessage ??
            postSubmitAction?.value ??
            "Thanks for submitting the form.",
        })
      } catch (err) {
        setError("root", {
          message:
            err instanceof Error
              ? err.message
              : "An error occurred while submitting the form.",
        })
      }
    },
    [schema, formId, portalId, setError, onSubmitted, enableRecaptcha]
  )

  if (submitted) {
    return (
      <div
        className="text-foreground text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: submitted.message }}
      />
    )
  }

  if (visibleFields.length === 0 && !schema.legalConsentOptions) {
    return (
      <Alert>
        <AlertTitle>No form fields configured</AlertTitle>
        <AlertDescription>
          This form has no visible fields. Please check the HubSpot form
          configuration.
        </AlertDescription>
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
              Please review the highlighted fields above and correct the errors.
            </div>
          )}

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <WarningIcon className="size-4" weight="bold" />
            <AlertTitle>Submission failed</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Submitting\u2026"
            : (schema.configuration?.submitButtonLabel ?? "Submit")}
        </Button>
      </form>
    </Form>
  )
}
