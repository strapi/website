import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr"
import { Fragment } from "react"

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
    return (
      <span className="text-strapi-neutral-700 text-base">{value.text}</span>
    )
  }

  return value.mark ? (
    <CheckIcon className="text-strapi-green-600" size={20} weight="bold" />
  ) : (
    <XIcon className="text-red-500" size={20} weight="bold" />
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

  return (
    <div className="rounded-strapi-lg border-strapi-neutral-200 overflow-hidden border">
      <div className="grid grid-cols-3">
        {/* Header row: empty label column + the two CMS logos */}
        <div className="border-strapi-neutral-200 border-b" />
        <div className="border-strapi-neutral-200 flex items-center justify-center border-b border-l px-2 py-5">
          <CMSLogo cms={firstCMS} className="max-h-8" />
        </div>
        <div className="border-strapi-neutral-200 flex items-center justify-center border-b border-l px-2 py-5">
          <CMSLogo cms={secondCMS} className="max-h-8" />
        </div>

        {categories.map((group) => (
          <Fragment key={group.category}>
            {/* Category header spans the label column; value columns stay empty */}
            <div className="border-strapi-neutral-200 flex items-center border-b py-3 pr-2 pl-6">
              <span className="text-strapi-blue-800 text-lg font-semibold">
                {group.category}
              </span>
            </div>
            <div className="border-strapi-neutral-200 border-b border-l" />
            <div className="border-strapi-neutral-200 border-b border-l" />

            {group.fields.map((field) => (
              <Fragment key={field.name}>
                <div className="border-strapi-neutral-200 flex items-center border-b py-3 pr-2 pl-6">
                  <span className="text-strapi-neutral-700 text-lg">
                    {field.name}
                  </span>
                </div>
                <div className="border-strapi-neutral-200 flex items-center justify-center border-b border-l px-2 py-3 text-center">
                  <FieldValue value={field.firstCMS} />
                </div>
                <div className="border-strapi-neutral-200 flex items-center justify-center border-b border-l px-2 py-3 text-center">
                  <FieldValue value={field.secondCMS} />
                </div>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
