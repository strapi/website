import { WarningIcon } from "@phosphor-icons/react/ssr"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isDevelopment } from "@/lib/general-helpers"

export function FormUnavailableAlert({ error }: { readonly error?: unknown }) {
  const errorMessage =
    error instanceof Error ? error.message : error ? String(error) : undefined

  return (
    <Alert variant="destructive">
      <WarningIcon className="size-4" weight="bold" />
      <AlertTitle>Form unavailable</AlertTitle>
      <AlertDescription>
        This form could not be loaded. Please try again later.
        {isDevelopment() && errorMessage && (
          <p className="mt-1 text-xs">{errorMessage}</p>
        )}
      </AlertDescription>
    </Alert>
  )
}
