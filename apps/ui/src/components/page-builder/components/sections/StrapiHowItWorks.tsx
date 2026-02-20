import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { SectionHeading } from "@/components/elementary/SectionHeading"
import { SectionIcon } from "@/components/elementary/SectionIcon"
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
        <SectionHeading
          as="h2"
          textStyle="h3"
          className="lg:text-strapi-header-2 mb-8"
        >
          {component.heading}
        </SectionHeading>

        {component.description && (
          <Typography
            tag="p"
            variant="subtitle1"
            textColor="primary"
            fontWeight="normal"
            className="mb-16 max-w-3xl"
          >
            {component.description}
          </Typography>
        )}

        {component.items && component.items.length > 0 && (
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-0">
            {component.items.map((item) => (
              <div
                key={item.id}
                className="flex-1 lg:px-12 lg:first:pl-0 lg:last:pr-0"
              >
                {item.icon && (
                  <SectionIcon size="sm" className="mb-5">
                    <StrapiBasicImage
                      component={item.icon}
                      fill
                      hideWhenMissing
                    />
                  </SectionIcon>
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

StrapiHowItWorks.displayName = "StrapiHowItWorks"

export default StrapiHowItWorks
