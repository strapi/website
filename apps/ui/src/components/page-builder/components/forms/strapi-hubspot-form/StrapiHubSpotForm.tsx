"use client"

import type { Data } from "@repo/strapi-types"
import { useEffect, useId } from "react"

import { Container } from "@/components/elementary/Container"
import { Spinner } from "@/components/elementary/Spinner"
import { logNonBlockingError } from "@/lib/logging"

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
  const { containerRef, status } = useHubSpotForm(portalId, formId)

  useEffect(() => {
    if (status !== "error") {
      return
    }

    logNonBlockingError("HubSpot form failed to render.", {
      formId,
      portalId,
    })
  }, [formId, portalId, status])

  return (
    <div className="relative" style={{ minHeight: placeholderHeight }}>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      )}

      <div
        ref={containerRef}
        id={stableId}
        className="relative bg-white transition-opacity duration-300"
        style={{ opacity: status === "ready" ? 1 : 0 }}
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
    <section className="py-8 lg:py-12">
      <Container>
        <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
          <HubSpotFormEmbed
            key={`${form.portalId}:${form.formId}`}
            portalId={form.portalId}
            formId={form.formId}
            placeholderHeight={placeholderHeight}
          />
        </div>
      </Container>
    </section>
  )
}
