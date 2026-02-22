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

          {component.items && component.items.length > 0 && (
            <Accordion collapsible className="mt-8" type="single">
              {component.items.map((item) => (
                <AccordionItem key={item.id} value={String(item.id)}>
                  <AccordionTrigger className="text-foreground py-5 text-lg font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </Container>
    </section>
  )
}
