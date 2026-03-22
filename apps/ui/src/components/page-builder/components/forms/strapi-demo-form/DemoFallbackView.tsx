import { Spinner } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DemoFallbackViewProps {
  readonly title?: string | null
  readonly description?: string | null
}

export function DemoFallbackView({
  title,
  description,
}: DemoFallbackViewProps) {
  const t = useTranslations("forms.demo")

  return (
    <Alert>
      <Spinner className="size-4 animate-spin" />
      <AlertTitle>{title ?? t("fallbackTitle")}</AlertTitle>
      <AlertDescription>
        {description ?? t("fallbackDescription")}
      </AlertDescription>
    </Alert>
  )
}
