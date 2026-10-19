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

export interface HubSpotSubmissionErrorDetail {
  readonly message: string
  readonly errorType: string
}

/**
 * Thrown when HubSpot rejects a submission (4xx). Carries HubSpot's own
 * error list so callers can surface a precise message (e.g. blocked email).
 */
export class HubSpotSubmissionError extends Error {
  readonly status: number
  readonly errors: readonly HubSpotSubmissionErrorDetail[]

  constructor(status: number, errors: readonly HubSpotSubmissionErrorDetail[]) {
    super(`HubSpot rejected the submission (status=${status})`)
    this.name = "HubSpotSubmissionError"
    this.status = status
    this.errors = errors
  }
}

function parseHubSpotErrors(text: string): HubSpotSubmissionErrorDetail[] {
  try {
    const parsed = JSON.parse(text) as {
      errors?: { message?: unknown; errorType?: unknown }[]
    }

    return (parsed.errors ?? [])
      .filter((e) => typeof e.errorType === "string")
      .map((e) => ({
        errorType: e.errorType as string,
        message: typeof e.message === "string" ? e.message : "",
      }))
  } catch {
    return []
  }
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

    // 4xx = HubSpot validated and rejected the data (blocked email, missing
    // field...). Surface the details so the UI can show a precise message.
    if (res.status >= 400 && res.status < 500) {
      throw new HubSpotSubmissionError(res.status, parseHubSpotErrors(text))
    }

    throw new Error("Form submission failed")
  }

  return res.json()
}
