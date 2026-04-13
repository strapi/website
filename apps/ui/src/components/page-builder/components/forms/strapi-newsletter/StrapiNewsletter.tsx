import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import {
  NewsletterForm,
  type NewsletterFormData,
} from "@/components/newsletter/NewsletterForm"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

interface StrapiNewsletterProps {
  readonly component: Data.Component<"forms.newsletter">
}

export function StrapiNewsletter({ component }: StrapiNewsletterProps) {
  const formData: NewsletterFormData = {
    title: component.title ?? "",
    description: component.description,
    emailPlaceholder: component.emailPlaceholder,
    submitLabel: component.submitLabel,
    consentText: component.consentText,
    hubspotForm: component.hubspotForm as NewsletterFormData["hubspotForm"],
  }

  return (
    <section>
      <Container className="relative">
        <Box variant="dark" className="rounded-strapi-lg">
          <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row md:items-end lg:gap-20">
            <div className="flex w-full max-w-140 min-w-90 flex-col gap-6 px-8 py-12 lg:px-14 lg:py-18">
              <SectionHeader size="xs" layout="left" className="gap-0">
                <SectionTitle as="h4" size="sm" variant="inverse">
                  {component.title}
                </SectionTitle>
                {component.description && (
                  <SectionDescription variant="inverse" size="sm">
                    {component.description}
                  </SectionDescription>
                )}
              </SectionHeader>

              <NewsletterForm data={formData} variant="dark" layout="inline" />
            </div>

            {component.image && (
              <div className="hidden shrink-0 items-center px-6 md:flex">
                <StrapiBasicImage
                  transparentPlaceholder
                  component={component.image}
                  mode="intrinsic"
                />
              </div>
            )}
          </div>
        </Box>
      </Container>
    </section>
  )
}
