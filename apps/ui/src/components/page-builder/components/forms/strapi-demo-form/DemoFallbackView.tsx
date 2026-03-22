import { Spinner } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DemoFallbackViewProps {
  readonly title?: string | null
  readonly description?: string | null
}

export function DemoFallbackView({
  title,
  description,
}: DemoFallbackViewProps) {
  return (
    <Alert>
      <Spinner className="size-4 animate-spin" />
      <AlertTitle>{title ?? "Setting up your demo..."}</AlertTitle>
      <AlertDescription>
        {description ?? "You'll receive access details via email shortly."}
      </AlertDescription>
    </Alert>
  )
}
