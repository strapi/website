import "server-only"

import { getEnvVar } from "@/lib/env-vars"

export interface HubSpotFieldOption {
  readonly label: string
  readonly value: string
}

export interface HubSpotField {
  readonly name: string
  readonly label: string
  readonly fieldType: string
  readonly required: boolean
  readonly hidden: boolean
  readonly placeholder?: string
  readonly description?: string
  readonly defaultValue?: string
  readonly options?: readonly HubSpotFieldOption[]
  readonly validation?: {
    readonly blockedEmailDomains?: readonly string[]
  }
}

export interface HubSpotLegalConsentOptions {
  readonly type?: string
  readonly communicationConsentText?: string
  readonly communicationsCheckboxes?: readonly {
    readonly label: string
    readonly subscriptionTypeId: number
  }[]
  readonly consentToProcessText?: string
  readonly consentToProcessFooterText?: string
  readonly consentToProcessCheckboxLabel?: string
  readonly privacyText?: string
}

export interface HubSpotFormSchema {
  readonly fieldGroups: readonly {
    readonly fields: readonly HubSpotField[]
  }[]
  readonly legalConsentOptions?: HubSpotLegalConsentOptions
  readonly configuration?: {
    readonly postSubmitAction?: {
      readonly type: string
      readonly value?: string
    }
    readonly submitButtonLabel?: string
  }
}

export interface HubSpotSubmitPayload {
  readonly formId: string
  readonly portalId: string
  readonly fields: Record<string, unknown>
  readonly legalConsentOptions?: {
    readonly consent: {
      readonly consentToProcess: boolean
      readonly text: string
      readonly communications: readonly {
        readonly value: boolean
        readonly subscriptionTypeId: number
        readonly text: string
      }[]
    }
  }
}

/**
 * Fetch a HubSpot form schema by form ID.
 * Server-only — requires HUBSPOT_API_TOKEN env var.
 */
export async function fetchHubSpotFormSchema(
  formId: string
): Promise<HubSpotFormSchema> {
  const token = getEnvVar("HUBSPOT_API_TOKEN", true)

  const res = await fetch(
    `https://api.hubapi.com/marketing/v3/forms/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    }
  )

  if (!res.ok) {
    throw new Error(
      `Failed to fetch HubSpot form schema (status=${res.status})`
    )
  }

  return res.json()
}

/**
 * Submit a HubSpot form via the submissions API.
 * Server-only — requires HUBSPOT_API_TOKEN env var.
 */
export async function submitHubSpotForm({
  portalId,
  formId,
  fields,
  legalConsentOptions,
}: {
  portalId: string
  formId: string
  fields: { name: string; value: unknown; objectTypeId: string }[]
  legalConsentOptions?: HubSpotSubmitPayload["legalConsentOptions"]
}): Promise<Record<string, unknown>> {
  const token = getEnvVar("HUBSPOT_API_TOKEN", true)

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submittedAt: String(Date.now()),
        fields,
        legalConsentOptions,
        skipValidation: true,
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error(
      `HubSpot form submission failed (status=${res.status}):`,
      text
    )
    throw new Error("Form submission failed")
  }

  return res.json()
}
