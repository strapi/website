import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"

export function StrapiTwoColumnsBenefits({
  component,
}: {
  readonly component: Data.Component<"sections.two-columns-benefits">
}) {
  return (
    <section className="py-8 lg:py-28">
      <Container className="flex flex-col gap-10 lg:flex-row lg:gap-8">
        {component.section && (
          <div className="lg:flex lg:flex-1 lg:items-center">
            <StrapiSectionHeader component={component.section} />
          </div>
        )}

        {component.items && component.items.length > 0 && (
          <div className="flex flex-col gap-4 lg:flex-1 lg:gap-14">
            {component.items.map((item) => (
              <div
                key={item.id}
                className="rounded-strapi-lg border-strapi-blue-200 bg-strapi-blue-100 border p-6 lg:flex lg:items-start lg:gap-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
              >
                <div className="lg:bg-strapi-neutral-300 hidden lg:block lg:w-1 lg:self-stretch lg:rounded-full" />

                <div className="flex flex-col gap-1 lg:gap-2">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                    {item.icon && (
                      <div className="relative size-8 shrink-0 lg:mt-0.5 lg:size-6">
                        <StrapiBasicImage
                          component={item.icon}
                          mode="fill"
                          className="object-contain"
                          sizes="24px"
                          decorative
                        />
                      </div>
                    )}

                    <h3 className="text-foreground text-lg font-semibold lg:text-xl">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-center text-sm lg:text-left lg:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
