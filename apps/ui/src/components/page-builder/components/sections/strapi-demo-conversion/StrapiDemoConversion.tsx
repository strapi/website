import type { Data } from "@repo/strapi-types"

import { StrapiDemoForm } from "@/components/page-builder/components/forms/strapi-demo-form"
import { ConversionLayout } from "@/components/page-builder/components/sections/strapi-conversion/ConversionLayout"

export async function StrapiDemoConversion({
  component,
}: {
  readonly component: Data.Component<"forms.demo-conversion">
}) {
  const formSlot = component.form ? (
    <StrapiDemoForm
      component={component.form}
      enableRecaptcha={component.enableRecaptcha ?? false}
    />
  ) : null

  return (
    <ConversionLayout
      section={component.section}
      features={component.features}
      infoBlocks={component.infoBlocks}
      formSlot={formSlot}
    />
  )
}
