import { CheckIcon, InfoIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { Fragment } from "react"

import { Container } from "@/components/elementary/Container"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { Tooltip } from "@/components/elementary/Tooltip"

type PlanType = Data.ContentType<"api::plan.plan">
type PlanFeatureType = Data.ContentType<"api::plan-feature.plan-feature">
type CategoryEnums = NonNullable<PlanFeatureType["category"]>
type PlanFeatureValue = NonNullable<PlanType["features"]>[number]
type PlanFeatureRow = {
  feature: PlanFeatureType
  planValues: (PlanFeatureValue | null)[]
}

const CATEGORY_ORDER: CategoryEnums[] = [
  "general",
  "cloud",
  "usage",
  "terms-and-services",
]

/**
 * Supports **bold** markdown syntax to highlight parts of the description.
 * E.g. `Starting at $99/mo **+$29/mo per project**`
 */
function renderDescription(description: string | null | undefined) {
  if (!description) {
    return null
  }

  const parts = description.split(/(\*\*.*?\*\*)/)

  return (
    <span className="text-strapi-neutral-700 text-sm font-normal">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="text-strapi-blue-500">
            {part.slice(2, -2)}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}

/**
 * Extracts all features across plans, groups them by category,
 * sorts by order and tracks per-plan feature values.
 */
function buildFeaturesByCategory(plans: PlanType[]) {
  const planFeatureIdentityMap = new Map<
    Data.ID,
    Map<Data.ID, PlanFeatureValue>
  >()

  /**
   * First pass: collect unique features per category and build identity map
   * so it's much more efficient in the second pass.
   */
  const featureByCategory = plans.reduce(
    (acc, currentPlan) => {
      const { features } = currentPlan

      if (!planFeatureIdentityMap.has(currentPlan.id)) {
        planFeatureIdentityMap.set(currentPlan.id, new Map())
      }

      const currentPlanFeatures = planFeatureIdentityMap.get(currentPlan.id)

      if (!features) {
        return acc
      }

      for (const planFeature of features) {
        const { feature } = planFeature

        if (!feature?.category) {
          continue
        }

        const categoryFeatures = (acc[feature.category] ??= new Map<
          Data.ID,
          PlanFeatureType
        >())
        categoryFeatures.set(feature.id, feature)

        currentPlanFeatures!.set(feature.id, planFeature)
      }

      return acc
    },
    {} as Partial<Record<CategoryEnums, Map<Data.ID, PlanFeatureType>>>
  )

  /**
   * Second pass: build ordered feature rows with per-plan values
   */
  const planFeaturesByCategory = Object.entries(featureByCategory).reduce(
    (acc, [category, features]) => {
      if (!features) {
        return acc
      }

      const categoryKey = category as CategoryEnums

      const orderedFeatures = Array.from(features.values()).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      )

      if (!Array.isArray(acc[categoryKey])) {
        acc[categoryKey] = []
      }

      for (const feature of orderedFeatures) {
        const planValues: (PlanFeatureValue | null)[] = []

        for (const plan of plans) {
          const currentPlanFeatures = planFeatureIdentityMap.get(plan.id)
          planValues.push(
            (currentPlanFeatures && currentPlanFeatures.get(feature.id)) ?? null
          )
        }

        acc[categoryKey]!.push({
          feature,
          planValues,
        })
      }

      return acc
    },
    {} as Partial<Record<CategoryEnums, PlanFeatureRow[]>>
  )

  const orderedCategories = CATEGORY_ORDER.filter((category) => {
    const categoryFeatures = planFeaturesByCategory[category]

    return Array.isArray(categoryFeatures) && categoryFeatures.length > 0
  })

  return { planFeaturesByCategory, orderedCategories }
}

/**
 * Renders comparison table of all features defined on plans.
 * The table is automatically constructed from the plan features, while
 * the category order is defined statically.
 */
export function StrapiPlanComparisonTable({
  component,
}: {
  readonly component: Data.Component<"plans.plan-comparison-table">
}) {
  const t = useTranslations()
  const { plans } = component

  if (!Array.isArray(plans) || plans.length === 0) {
    return null
  }

  const { planFeaturesByCategory, orderedCategories } =
    buildFeaturesByCategory(plans)

  return (
    <Container id="comparative-table">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-64 px-4 py-2 text-left" />
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  scope="col"
                  className="w-40 min-w-40 px-2 py-2 text-center align-bottom"
                >
                  <span className="text-base font-semibold uppercase">
                    {plan.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedCategories.map((category) => {
              const features = planFeaturesByCategory[category] ?? []

              return (
                <Fragment key={category}>
                  <tr className="bg-strapi-neutral-100">
                    <th
                      colSpan={plans.length + 1}
                      scope="colgroup"
                      className="px-2 py-2 text-left"
                    >
                      <span className="text-foreground text-lg font-semibold">
                        {t(`plans.planFeatureCategory.${category}` as never)}
                      </span>
                    </th>
                  </tr>
                  {features.map(({ feature, planValues }) => (
                    <tr
                      key={feature.id}
                      className="border-strapi-neutral-100 border-b"
                    >
                      <th
                        scope="row"
                        className="py-3 pr-2 pl-4 text-left align-top"
                      >
                        <div className="flex flex-col gap-3">
                          <span className="flex items-center">
                            <span className="text-foreground text-sm font-normal">
                              {feature.name}
                            </span>
                            {feature?.tooltip?.content && (
                              <Tooltip
                                contentProps={{
                                  sideOffset: 4,
                                  className:
                                    "bg-strapi-blue-800 text-white [&_[data-slot=tooltip-arrow]]:fill-strapi-blue-800",
                                }}
                                content={feature?.tooltip?.content}
                              >
                                <button
                                  type="button"
                                  className="text-strapi-neutral-500 hover:text-strapi-neutral-700 ml-1 inline-flex shrink-0 items-center"
                                  aria-label={t("general.moreInformation")}
                                >
                                  <InfoIcon className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            )}
                          </span>
                          {renderDescription(feature.description)}
                        </div>
                      </th>
                      {planValues.map((planValue, index) => {
                        const value = planValue?.value?.trim() ?? ""
                        const mobileValue = planValue?.mobileValue?.trim() ?? ""
                        const mobileText = mobileValue || value
                        const desktopText = value || mobileValue
                        const hasTextValue = !!(mobileText || desktopText)

                        return (
                          <td
                            key={`${feature.id}-${plans[index]?.id ?? index}`}
                            className="w-[120px] min-w-[120px] px-2 py-3 text-center align-middle"
                          >
                            {hasTextValue ? (
                              <span className="text-foreground text-base font-medium">
                                <span className="md:hidden">{mobileText}</span>
                                <span className="hidden md:inline">
                                  {desktopText}
                                </span>
                              </span>
                            ) : planValue ? (
                              <span className="inline-flex items-center justify-center">
                                <CheckIcon weight="bold" className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="text-foreground text-base font-medium">
                                -
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {component.footnote && (
        <div className="text-strapi-neutral-700 mt-4 px-4 text-sm">
          <InlineMarkdown allowNewLines>{component.footnote}</InlineMarkdown>
        </div>
      )}
    </Container>
  )
}
