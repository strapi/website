import type { Data } from "@repo/strapi-types"

import { FormUnavailableAlert } from "@/components/elementary/FormUnavailableAlert"
import { HubSpotSsrForm } from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/HubSpotSsrForm"
import { fetchHubSpotFormSchema } from "@/lib/hubspot"
import { logNonBlockingError } from "@/lib/logging"

import { ConversionLayout } from "./ConversionLayout"

export async function StrapiConversion({
  component,
}: {
  readonly component: Data.Component<"forms.conversion">
}) {
  const form = component.form

  const portalId = form?.form?.portalId
  const formId = form?.form?.formId
  let formSchema = null
  let formError: unknown = null

  if (portalId && formId) {
    try {
      formSchema = await fetchHubSpotFormSchema(formId)
    } catch (error) {
      logNonBlockingError("Failed to fetch HubSpot form schema", {
        formId,
        error: error instanceof Error ? error.message : String(error),
      })
      formError = error
    }
  }

  const formSlot =
    formSchema && portalId && formId ? (
      <HubSpotSsrForm schema={formSchema} portalId={portalId} formId={formId} />
    ) : (
      <FormUnavailableAlert error={formError} />
    )

  return (
    <ConversionLayout
      section={component.section}
      features={component.features}
      infoBlocks={component.infoBlocks}
      formSlot={formSlot}
    />
  )
}
