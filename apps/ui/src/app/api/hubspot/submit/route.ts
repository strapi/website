import {
  CONSENT_FIELD_PREFIX,
  CONSENT_TO_PROCESS_FIELD,
} from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/helpers"
import { submitHubSpotForm } from "@/lib/hubspot"
import { verifyRecaptcha } from "@/lib/recaptcha"

export const dynamic = "force-dynamic"

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

    return Response.json(
      { error: "Form submission failed. Please try again." },
      { status: 500 }
    )
  }
}

export { handler as POST }
