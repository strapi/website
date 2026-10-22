import {
  CONSENT_FIELD_PREFIX,
  CONSENT_TO_PROCESS_FIELD,
} from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/helpers"
import { HubSpotSubmissionError, submitHubSpotForm } from "@/lib/hubspot"
import { verifyRecaptcha } from "@/lib/recaptcha"

export const dynamic = "force-dynamic"

/** HubSpot error types that always concern the email field. */
const EMAIL_ERROR_TYPES = new Set(["BLOCKED_EMAIL", "INVALID_EMAIL"])

/**
 * Best-effort mapping of a HubSpot error to the form field it concerns.
 * HubSpot messages look like `fields.email.value: ...` or mention the field name.
 */
function fieldForHubSpotError(
  errorType: string,
  message: string,
  fieldNames: string[]
): string | undefined {
  if (EMAIL_ERROR_TYPES.has(errorType)) {
    return "email"
  }

  const fromPath = /fields\.(\w+)/.exec(message)?.[1]

  if (fromPath && fieldNames.includes(fromPath)) {
    return fromPath
  }

  return fieldNames.find((name) => message.includes(`'${name}'`))
}

/** Proxy for HubSpot form submissions — verifies reCAPTCHA (opt-in), strips consent fields, and forwards to HubSpot API. */
async function handler(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body?.formId || !body?.portalId) {
    return Response.json(
      { error: "Missing formId or portalId" },
      { status: 400 }
    )
  }

  const {
    formId,
    portalId,
    fields = {},
    legalConsentOptions,
    recaptchaToken,
  } = body

  // Verify reCAPTCHA when token is provided (score-based v3).
  // If no token is sent, verification is skipped — reCAPTCHA is opt-in per form.
  if (recaptchaToken) {
    const isHuman = await verifyRecaptcha(recaptchaToken)

    if (!isHuman) {
      return Response.json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 403 }
      )
    }
  }

  // Transform fields object into HubSpot's expected array format.
  // Filter out consent fields — they are handled separately via legalConsentOptions.
  const hubspotFields = Object.entries(fields)
    .filter(
      ([name]) =>
        !name.startsWith(CONSENT_FIELD_PREFIX) &&
        name !== CONSENT_TO_PROCESS_FIELD
    )
    .map(([name, value]) => ({ name, value, objectTypeId: "0-1" })) // 0-1 = HubSpot Contact object

  try {
    const result = await submitHubSpotForm({
      portalId,
      formId,
      fields: hubspotFields,
      legalConsentOptions,
    })

    return Response.json(result)
  } catch (error) {
    console.error("Error submitting HubSpot form:", error)

    // HubSpot rejected the data: pass the reasons through (with the field
    // they concern) so the UI can show them inline instead of a generic error.
    if (error instanceof HubSpotSubmissionError && error.errors.length > 0) {
      const fieldNames = hubspotFields.map((f) => f.name)

      return Response.json(
        {
          error:
            "Form submission failed. Please review the highlighted fields.",
          errors: error.errors.map((e) => ({
            code: e.errorType,
            message: e.message,
            field: fieldForHubSpotError(e.errorType, e.message, fieldNames),
          })),
        },
        { status: 400 }
      )
    }

    return Response.json(
      { error: "Form submission failed. Please try again." },
      { status: 500 }
    )
  }
}

export { handler as POST }
