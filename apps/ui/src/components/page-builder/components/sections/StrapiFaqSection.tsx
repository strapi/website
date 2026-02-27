import { MinusCircleIcon, PlusCircleIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function StrapiFaqSection({
  component,
}: {
  readonly component: Data.Component<"sections.faq-section">
}) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeader>
            <SectionLabel>{component.sectionLabel}</SectionLabel>
            <SectionTitle as="h2">{component.heading}</SectionTitle>
            <SectionDescription>{component.description}</SectionDescription>
          </SectionHeader>
        </div>

        {component.items && component.items.length > 0 && (
          <Accordion
            collapsible
            className="mx-auto mt-12 max-w-4xl"
            type="single"
          >
            {component.items.map((item) => (
              <AccordionItem
                key={item.id}
                value={String(item.id)}
                className="rounded-strapi-lg border-strapi-neutral-200 bg-strapi-blue-100 data-[state=open]:border-strapi-purple-500 mb-2 border px-6 transition-all duration-100 ease-in-out last:mb-0 last:border-b hover:bg-white data-[state=open]:bg-white"
              >
                <AccordionTrigger
                  className="text-foreground [&[data-state=open]>svg]:text-strapi-purple-500 items-center py-6 text-base font-medium hover:no-underline [&[data-state=closed]>svg[data-icon=minus]]:hidden [&[data-state=closed]>svg[data-icon=plus]]:inline [&[data-state=open]>svg]:rotate-0 [&[data-state=open]>svg[data-icon=minus]]:inline [&[data-state=open]>svg[data-icon=plus]]:hidden"
                  icon={
                    <>
                      <PlusCircleIcon
                        data-icon="plus"
                        className="text-strapi-neutral-400 size-6"
                      />
                      <MinusCircleIcon
                        data-icon="minus"
                        className="text-strapi-neutral-400 hidden size-6"
                      />
                    </>
                  }
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-8 text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Container>
    </section>
  )
}

StrapiFaqSection.displayName = "StrapiFaqSection"

export default StrapiFaqSection
