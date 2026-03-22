import { z } from "zod"

import type {
  HubSpotFormSchema,
  HubSpotField,
  HubSpotSubmitPayload,
} from "@/lib/hubspot"

export const CONSENT_FIELD_PREFIX = "consent_communications_"
export const CONSENT_TO_PROCESS_FIELD = "consentToProcess"

const warnedFieldTypes = new Set<string>()

/** Maps HubSpot field types (e.g. `single_line_text`) to HTML input types (e.g. `text`). */
export function mapFieldType(fieldType: string): string {
  switch (fieldType) {
    case "email":
      return "email"
    case "single_line_text":
      return "text"
    case "multi_line_text":
      return "textarea"
    case "dropdown":
      return "select"
    case "phone":
      return "tel"
    case "number":
      return "number"
    case "single_checkbox":
      return "checkbox"
    case "radio":
      return "radio"

    default:
      if (!warnedFieldTypes.has(fieldType)) {
        warnedFieldTypes.add(fieldType)
        console.warn(
          `[HubSpotForm] Unsupported field type "${fieldType}", falling back to text input`
        )
      }

      return "text"
  }
}

export function buildDefaultValues(
  schema: HubSpotFormSchema
): Record<string, unknown> {
  const initial: Record<string, unknown> = {}

  for (const group of schema.fieldGroups) {
    for (const field of group.fields) {
      if (field.hidden) continue

      if (field.fieldType === "single_checkbox") {
        initial[field.name] = field.defaultValue === "true"
      } else if (field.fieldType === "number") {
        initial[field.name] = field.defaultValue
          ? Number(field.defaultValue)
          : ""
      } else {
        initial[field.name] = field.defaultValue ?? ""
      }
    }
  }

  const communications =
    schema.legalConsentOptions?.communicationsCheckboxes ?? []
  for (let i = 0; i < communications.length; i++) {
    initial[`${CONSENT_FIELD_PREFIX}${i}`] = false
  }

  if (schema.legalConsentOptions?.consentToProcessCheckboxLabel) {
    initial[CONSENT_TO_PROCESS_FIELD] = false
  }

  return initial
}

export function buildZodSchema(schema: HubSpotFormSchema) {
  const shape: Record<string, z.ZodType> = {}

  for (const group of schema.fieldGroups) {
    for (const field of group.fields) {
      if (field.hidden) continue

      shape[field.name] = buildFieldValidator(field)
    }
  }

  const communications =
    schema.legalConsentOptions?.communicationsCheckboxes ?? []
  for (let i = 0; i < communications.length; i++) {
    shape[`${CONSENT_FIELD_PREFIX}${i}`] = z.boolean().optional()
  }

  if (schema.legalConsentOptions?.consentToProcessCheckboxLabel) {
    shape[CONSENT_TO_PROCESS_FIELD] = z.literal(true, {
      error: "Required",
    })
  }

  return z.object(shape)
}

function buildFieldValidator(field: HubSpotField): z.ZodType {
  switch (field.fieldType) {
    case "email": {
      let base = z.string().trim()
      if (field.required) base = base.min(1)
      const emailValidator = base.email()

      const blocked = field.validation?.blockedEmailDomains
      if (blocked && blocked.length > 0) {
        const blockedLower = new Set(blocked.map((d) => d.toLowerCase()))
        const refined = emailValidator.refine(
          (value) => {
            if (!value) return true
            const domain = value.split("@")[1]?.toLowerCase() ?? ""

            return !blockedLower.has(domain)
          },
          { message: "Email domain not allowed" }
        )

        return field.required ? refined : refined.optional()
      }

      return field.required ? emailValidator : emailValidator.optional()
    }

    case "number":
      return field.required
        ? z.coerce.number()
        : z.union([z.literal(""), z.coerce.number()])

    case "single_checkbox":
      return field.required
        ? z.literal(true, { error: "Required" })
        : z.boolean()

    // Can be implemented later if needed
    // case "multi_line_text":
    // case "dropdown":
    // case "phone":
    // case "radio":
    // case "single_line_text":

    default: {
      const strValidator = z.string().trim()

      return field.required ? strValidator.min(1) : strValidator.optional()
    }
  }
}

/** Transforms react-hook-form values into HubSpot's submission format, separating consent fields from regular fields. */
export function buildSubmissionPayload({
  schema,
  values,
  formId,
  portalId,
}: {
  schema: HubSpotFormSchema
  values: Record<string, unknown>
  formId: string
  portalId: string
}): HubSpotSubmitPayload {
  const consentType = schema.legalConsentOptions?.type
  const payload: HubSpotSubmitPayload = {
    formId,
    portalId,
    fields: values,
  }

  if (consentType && consentType !== "none") {
    const communicationsCheckboxes =
      schema.legalConsentOptions?.communicationsCheckboxes ?? []

    const communications = communicationsCheckboxes.map((c, i) => ({
      value: !!values[`${CONSENT_FIELD_PREFIX}${i}`],
      subscriptionTypeId: c.subscriptionTypeId,
      text: c.label,
    }))

    const isImplicitConsent =
      consentType === "implicit_consent_to_process" ||
      consentType === "legitimate_interest"

    const consentToProcess = isImplicitConsent
      ? true
      : !!values[CONSENT_TO_PROCESS_FIELD]

    const consentText =
      schema.legalConsentOptions?.consentToProcessText ??
      schema.legalConsentOptions?.privacyText ??
      ""

    return {
      ...payload,
      legalConsentOptions: {
        consent: {
          consentToProcess,
          text: consentText,
          communications,
        },
      },
    }
  }

  return payload
}
