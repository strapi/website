import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import type { NewsletterHubspotRef } from "@/components/newsletter/NewsletterForm"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

interface StrapiNewsletterProps {
  readonly component: Data.Component<"forms.newsletter">
}

export function StrapiNewsletter({ component }: StrapiNewsletterProps) {
  const hubspotForm = component.hubspotForm as NewsletterHubspotRef | null

  return (
    <Container className="py-16 lg:py-24">
      <NewsletterSignup presentation="banner" hubspotForm={hubspotForm} />
    </Container>
  )
}
