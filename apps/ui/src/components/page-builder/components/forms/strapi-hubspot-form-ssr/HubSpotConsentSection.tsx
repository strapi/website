"use client"

import type { Control, FieldValues } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { HubSpotLegalConsentOptions } from "@/lib/hubspot"

import { CONSENT_FIELD_PREFIX, CONSENT_TO_PROCESS_FIELD } from "./helpers"

interface HubSpotConsentSectionProps {
  readonly legalConsentOptions: HubSpotLegalConsentOptions | undefined
  readonly control: Control<FieldValues>
}

function ConsentHtml({ html }: { readonly html: string }) {
  return (
    <div
      className="text-muted-foreground text-xs leading-relaxed [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function HubSpotConsentSection({
  legalConsentOptions,
  control,
}: HubSpotConsentSectionProps) {
  if (!legalConsentOptions) return null

  return (
    <>
      {legalConsentOptions.communicationConsentText && (
        <ConsentHtml html={legalConsentOptions.communicationConsentText} />
      )}

      {legalConsentOptions.communicationsCheckboxes?.map((checkbox, index) => (
        <FormField
          key={`comm-${index}`}
          name={`${CONSENT_FIELD_PREFIX}${index}`}
          control={control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel
                className="text-xs leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: checkbox.label }}
              />
            </FormItem>
          )}
        />
      ))}

      {legalConsentOptions.consentToProcessText && (
        <ConsentHtml html={legalConsentOptions.consentToProcessText} />
      )}

      {legalConsentOptions.consentToProcessFooterText && (
        <ConsentHtml html={legalConsentOptions.consentToProcessFooterText} />
      )}

      {legalConsentOptions.consentToProcessCheckboxLabel && (
        <FormField
          name={CONSENT_TO_PROCESS_FIELD}
          control={control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel
                  className="text-xs leading-relaxed font-normal"
                  dangerouslySetInnerHTML={{
                    __html:
                      legalConsentOptions.consentToProcessCheckboxLabel ?? "",
                  }}
                />
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      )}

      {legalConsentOptions.privacyText && (
        <ConsentHtml html={legalConsentOptions.privacyText} />
      )}
    </>
  )
}
