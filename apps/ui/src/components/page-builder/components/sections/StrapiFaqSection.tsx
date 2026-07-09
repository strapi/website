import { MinusCircleIcon, PlusCircleIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"

import { Container } from "@/components/elementary/Container"
import { Markdown } from "@/components/elementary/markdown/Markdown"
import {
  SectionHeader,
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
  const t = useTranslations("sections.faq")

  return (
    <section>
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeader>
            <SectionTitle as="h2">{component.title || t("title")}</SectionTitle>
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
                  className="text-foreground [&[data-state=open]>svg]:text-strapi-purple-500 shrink-0 items-center py-6 text-base font-medium hover:no-underline [&[data-state=closed]>svg[data-icon=minus]]:hidden [&[data-state=closed]>svg[data-icon=plus]]:inline [&[data-state=open]>svg]:rotate-0 [&[data-state=open]>svg[data-icon=minus]]:inline [&[data-state=open]>svg[data-icon=plus]]:hidden"
                  icon={
                    <>
                      <PlusCircleIcon
                        data-icon="plus"
                        className="text-strapi-neutral-400 size-6 shrink-0"
                      />
                      <MinusCircleIcon
                        data-icon="minus"
                        className="text-strapi-neutral-400 hidden size-6 shrink-0"
                      />
                    </>
                  }
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-8">
                  <Markdown className="text-muted-foreground [&_p:last-child]:mb-0">
                    {item.answer}
                  </Markdown>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Container>
    </section>
  )
}
