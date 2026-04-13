import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { CMSEntry } from "@/lib/cms-comparison-utils"

import { CMSLogo } from "../page-builder/components/sections/StrapiComparatorGrid"

interface FieldComparison {
  name: string
  firstCMS: { mark: boolean; text: string | null }
  secondCMS: { mark: boolean; text: string | null }
}

interface CategoryGroup {
  category: string
  fields: FieldComparison[]
}

function deduplicateFields(
  fields: CMSEntry["fields"]
): NonNullable<CMSEntry["fields"]> {
  const seen = new Set<string>()

  return (fields ?? []).filter((f) => {
    const key = `${f.category.toLowerCase()}::${f.name.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

function buildCategoryGroups(
  firstCMS: CMSEntry,
  secondCMS: CMSEntry
): CategoryGroup[] {
  const groups: CategoryGroup[] = []
  const dedupedFirst = deduplicateFields(firstCMS.fields)
  const dedupedSecond = deduplicateFields(secondCMS.fields)

  for (const field of dedupedFirst) {
    const secondField = dedupedSecond.find(
      (f) => f.name.toLowerCase() === field.name.toLowerCase()
    )

    const comparison: FieldComparison = {
      name: field.name,
      firstCMS: { mark: field.mark, text: field.text },
      secondCMS: {
        mark: secondField?.mark ?? false,
        text: secondField?.text ?? null,
      },
    }

    const existing = groups.find(
      (g) => g.category.toLowerCase() === field.category.toLowerCase()
    )

    if (existing) {
      existing.fields.push(comparison)
    } else {
      groups.push({ category: field.category, fields: [comparison] })
    }
  }

  return groups
}

function FieldValue({
  value,
}: {
  readonly value: { mark: boolean; text: string | null }
}) {
  if (value.text) {
    return <span className="text-strapi-neutral-700 text-sm">{value.text}</span>
  }

  return value.mark ? (
    <CheckIcon className="text-green-600" size={20} weight="bold" />
  ) : (
    <XIcon className="text-strapi-neutral-400" size={20} weight="bold" />
  )
}

export function CmsComparisonTable({
  firstCMS,
  secondCMS,
}: {
  readonly firstCMS: CMSEntry
  readonly secondCMS: CMSEntry
}) {
  const categories = buildCategoryGroups(firstCMS, secondCMS)

  if (categories.length === 0) {
    return null
  }

  const defaultOpen = categories[0]?.category

  return (
    <div className="rounded-strapi-lg overflow-hidden border">
      <div className="bg-strapi-neutral-100 grid grid-cols-[1fr_1fr_1fr] items-center border-b px-4 py-4 lg:px-6">
        <div />
        <div className="flex justify-center">
          <CMSLogo cms={firstCMS} className="max-h-8" />
        </div>
        <div className="flex justify-center">
          <CMSLogo cms={secondCMS} className="max-h-8" />
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={defaultOpen ? [defaultOpen] : []}
      >
        {categories.map((group) => (
          <AccordionItem key={group.category} value={group.category}>
            <AccordionTrigger className="bg-strapi-neutral-100/50 px-4 py-3 text-sm font-semibold lg:px-6">
              {group.category}
            </AccordionTrigger>
            <AccordionContent className="p-0">
              {group.fields.map((field) => (
                <div
                  key={field.name}
                  className="hover:bg-strapi-neutral-100/30 grid grid-cols-[1fr_1fr_1fr] items-center border-t px-4 py-3 lg:px-6"
                >
                  <span className="text-strapi-neutral-800 text-sm font-medium">
                    {field.name}
                  </span>
                  <div className="flex justify-center">
                    <FieldValue value={field.firstCMS} />
                  </div>
                  <div className="flex justify-center">
                    <FieldValue value={field.secondCMS} />
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
