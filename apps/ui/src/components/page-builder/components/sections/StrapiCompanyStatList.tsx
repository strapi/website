import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { Typography } from "@/components/typography"

export function StrapiCompanyStatList({
  component,
}: {
  readonly component: Data.Component<"sections.company-stat-list">
}) {
  return (
    <section className="py-16 lg:py-32">
      <Container>
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-y-16">
            {component.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2.5">
                <Typography tag="p" variant="header2">
                  {item.value}
                </Typography>

                <Typography tag="p" variant="subtitle2" textColor="neutral">
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
