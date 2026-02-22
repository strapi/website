import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { Typography } from "@/components/typography"

export function StrapiHowItWorks({
  component,
}: {
  readonly component: Data.Component<"sections.how-it-works">
}) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <SectionHeader layout="left">
          <SectionTitle as="h2" size="default">
            {component.heading}
          </SectionTitle>
          <SectionDescription>{component.description}</SectionDescription>
        </SectionHeader>

        {component.items && component.items.length > 0 && (
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-0">
            {component.items.map((item) => (
              <div
                key={item.id}
                className="flex-1 lg:px-12 lg:first:pl-0 lg:last:pr-0"
              >
                {item.icon && (
                  <StrapiBasicImage
                    component={item.icon}
                    fill
                    hideWhenMissing
                  />
                )}

                <Typography
                  tag="h3"
                  variant="body1"
                  textColor="primary"
                  fontWeight="semiBold"
                  className="lg:text-strapi-subtitle-1 mb-4"
                >
                  {item.title}
                </Typography>

                <Typography tag="p" variant="body1" textColor="primary">
                  {item.description}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
