import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

import { TestimonyCard } from "./TestimonyCard"

export function StrapiTestimonies({
  component,
}: {
  readonly component: Data.Component<"sections.testimonies">
}) {
  if (!component.items || component.items.length === 0) {
    return null
  }

  return (
    <section className="py-20">
      <Container>
        <div className="flex flex-wrap justify-center gap-8">
          {component.items.map((item) => (
            <div
              key={item.id}
              className="w-full max-w-[590px] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.375rem)]"
            >
              <TestimonyCard item={item} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
