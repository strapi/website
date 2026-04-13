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

interface BlogNewsletterProps {
  readonly newsletter: NewsletterFormData
}

export function BlogNewsletter({ newsletter }: BlogNewsletterProps) {
  return (
    <section>
      <Container className="relative">
        <Box variant="dark" className="rounded-strapi-lg">
          <div className="relative z-10 flex w-full flex-col gap-6 px-8 py-12 lg:px-14 lg:py-18">
            <SectionHeader size="xs" layout="left" className="gap-0">
              <SectionTitle as="h4" size="sm" variant="inverse">
                {newsletter.title}
              </SectionTitle>
              {newsletter.description && (
                <SectionDescription variant="inverse" size="sm">
                  {newsletter.description}
                </SectionDescription>
              )}
            </SectionHeader>

            <div className="max-w-140">
              <NewsletterForm
                data={newsletter}
                variant="dark"
                layout="inline"
              />
            </div>
          </div>
        </Box>
      </Container>
    </section>
  )
}
