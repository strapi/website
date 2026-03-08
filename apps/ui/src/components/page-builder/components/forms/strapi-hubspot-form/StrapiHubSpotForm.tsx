"use client"

import type { Data } from "@repo/strapi-types"
import { useEffect, useId, useState } from "react"

import { Container } from "@/components/elementary/Container"
import { Spinner } from "@/components/elementary/Spinner"

import { useHubSpotForm } from "./useHubSpotForm"

const DEFAULT_PLACEHOLDER_HEIGHT = 300

function HubSpotFormEmbed({
  portalId,
  formId,
  placeholderHeight,
}: {
  readonly portalId: string
  readonly formId: string
  readonly placeholderHeight: number
}) {
  const id = useId()
  const stableId = `hsform${id.replaceAll(":", "")}`
  const { containerRef, isLoaded } = useHubSpotForm(portalId, formId)
  const [showSpinner, setShowSpinner] = useState(true)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    const timeout = setTimeout(() => setShowSpinner(false), 300)

    return () => clearTimeout(timeout)
  }, [isLoaded])

  return (
    <div className="relative" style={{ minHeight: placeholderHeight }}>
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      )}

      <div
        ref={containerRef}
        id={stableId}
        className="relative bg-white transition-opacity duration-300"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </div>
  )
}

export function StrapiHubSpotForm({
  component,
}: {
  readonly component: Data.Component<"forms.hubspot-form">
}) {
  const form = component.form

  if (!form?.portalId || !form?.formId) {
    return null
  }

  const placeholderHeight = form.placeholderHeight ?? DEFAULT_PLACEHOLDER_HEIGHT

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
          <HubSpotFormEmbed
            portalId={form.portalId}
            formId={form.formId}
            placeholderHeight={placeholderHeight}
          />
        </div>
      </Container>
    </section>
  )
}
