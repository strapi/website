import type { Data } from "@repo/strapi-types"

import type { NewsletterHubspotRef } from "@/components/newsletter/NewsletterForm"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

interface StrapiNewsletterProps {
  readonly component: Data.Component<"forms.newsletter">
}

export function StrapiNewsletter({ component }: StrapiNewsletterProps) {
  const hubspotForm = component.hubspotForm as NewsletterHubspotRef | null

  return <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
}
