import type { Data } from "@repo/strapi-types"

import { Markdown } from "@/components/elementary/markdown/Markdown"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

type HubSpotFormEntry = Pick<
  Data.ContentType<"api::hubspot-form.hubspot-form">,
  "thankYouImage" | "thankYouMessage"
>

/**
 * Returns true when the CMS entry carries a custom thank-you block.
 * HubSpot forms built in the new editor return an empty `inlineMessage`
 * from the legacy submissions API, so the CMS content is the reliable source.
 */
export function hasThankYouContent(
  form: Partial<HubSpotFormEntry> | null | undefined
): boolean {
  return Boolean(form?.thankYouMessage?.trim() || form?.thankYouImage?.media)
}

/**
 * Server-rendered thank-you block shown in place of the form after a
 * successful submission. Mirrors the "On submit" step configured in HubSpot:
 * an optional image (e.g. the logo) followed by a markdown message.
 */
export function HubSpotThankYou({
  form,
}: {
  readonly form: Partial<HubSpotFormEntry> | null | undefined
}) {
  if (!hasThankYouContent(form)) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      {form?.thankYouImage?.media ? (
        <StrapiBasicImage
          component={form.thankYouImage}
          className="h-auto max-h-24 w-auto"
          hideWhenMissing
        />
      ) : null}

      {form?.thankYouMessage?.trim() ? (
        <Markdown className="[&_p]:text-muted-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-sm [&_p:last-child]:mb-0">
          {form.thankYouMessage}
        </Markdown>
      ) : null}
    </div>
  )
}
