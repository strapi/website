import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { FormUnavailableAlert } from "@/components/elementary/FormUnavailableAlert"
import { fetchHubSpotFormSchema } from "@/lib/hubspot"
import { logNonBlockingError } from "@/lib/logging"

import { HubSpotSsrForm } from "./HubSpotSsrForm"

export async function StrapiHubSpotFormSsr({
  component,
}: {
  readonly component: Data.Component<"forms.hubspot-form-ssr">
}) {
  const form = component.form

  if (!form?.portalId || !form?.formId) {
    return null
  }

  let schema

  try {
    schema = await fetchHubSpotFormSchema(form.formId)
  } catch (error) {
    logNonBlockingError("Failed to fetch HubSpot form schema", {
      formId: form.formId,
      error: error instanceof Error ? error.message : String(error),
    })

    return (
      <section>
        <Container>
          <div className="mx-auto max-w-xl">
            <FormUnavailableAlert error={error} />
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section>
      <Container>
        <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
          <HubSpotSsrForm
            schema={schema}
            portalId={form.portalId}
            formId={form.formId}
            enableRecaptcha={component.enableRecaptcha ?? false}
            title={component.title}
          />
        </div>
      </Container>
    </section>
  )
}
