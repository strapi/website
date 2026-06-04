import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export function StrapiHowItWorks({
  component,
}: {
  readonly component: Data.Component<"sections.how-it-works">
}) {
  return (
    <section>
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
                    mode="responsive"
                    className="mb-4 h-6 w-auto object-contain"
                    hideWhenMissing
                    sizes="24px"
                    decorative
                  />
                )}

                <h3 className="text-foreground mb-4 text-lg font-semibold lg:text-2xl">
                  {item.title}
                </h3>

                <p className="text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
