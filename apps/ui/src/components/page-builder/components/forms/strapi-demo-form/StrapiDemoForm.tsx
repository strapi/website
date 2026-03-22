import type { Data } from "@repo/strapi-types"

import { FormUnavailableAlert } from "@/components/elementary/FormUnavailableAlert"
import { env } from "@/env.mjs"
import { fetchHubSpotFormSchema } from "@/lib/hubspot"
import { logNonBlockingError } from "@/lib/logging"

import { DemoForm } from "./DemoForm"

export async function StrapiDemoForm({
  component,
  enableRecaptcha,
}: {
  readonly component: Data.Component<"forms.demo-form">
  /** Override from parent section (e.g. demo-conversion). Falls back to component's own toggle. */
  readonly enableRecaptcha?: boolean
}) {
  const hubspotForm = component.form

  if (!hubspotForm?.portalId || !hubspotForm?.formId) {
    return null
  }

  if (!env.DEMO_OPERATOR_TOKEN) {
    return <FormUnavailableAlert />
  }

  let schema

  try {
    schema = await fetchHubSpotFormSchema(hubspotForm.formId)
  } catch (error) {
    logNonBlockingError("Failed to fetch HubSpot form schema for demo form", {
      formId: hubspotForm.formId,
      error: error instanceof Error ? error.message : String(error),
    })

    return <FormUnavailableAlert error={error} />
  }

  return (
    <DemoForm
      schema={schema}
      portalId={hubspotForm.portalId}
      formId={hubspotForm.formId}
      enableRecaptcha={enableRecaptcha ?? component.enableRecaptcha ?? false}
      config={{
        successTitle: component.successTitle,
        successDescription: component.successDescription,
        fallbackTitle: component.fallbackTitle,
        fallbackDescription: component.fallbackDescription,
      }}
    />
  )
}
