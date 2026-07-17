"use client"

import { ArrowClockwiseIcon } from "@phosphor-icons/react"

import { AppLink } from "@/components/elementary/AppLink"
import { Typography } from "@/components/typography"
import { Button } from "@/components/ui/button"

/**
 * Error states of the license-key flow (/order-confirmation, /get-license),
 * ported from website-2020 `components/tokenErrors`. The keys are error codes
 * returned by the license registry API.
 */
interface ErrorDetail {
  title: string
  message: string
  buttonText?: string
  email?: string
}

const defaultError: ErrorDetail = {
  title: "An error occurred",
  message: "Something went wrong on our end. Please try again later.",
}

const errorDetails: Record<string, ErrorDetail> = {
  ERR_TOKEN_NOT_FOUND: {
    title: "License is not available",
    message:
      "Your license is currently being generated and is not ready at this time. Please check back in a few moments.",
    buttonText: "Retry",
  },
  ERR_TOKEN_EXPIRED: {
    title: "Access expired",
    message:
      "The delay to access your license through the browser has passed. To retrieve your license, please contact our support team for further assistance.",
    buttonText: "Contact support team",
    email: "support@strapi.io",
  },
  ERR_NO_USAGE_LEFT: {
    title: "License view limit has been reached",
    message:
      "The license has been already viewed. For security reasons, it can only be accessed once. If you’ve lost your license, please contact our support team to request it again.",
    buttonText: "Contact support team",
    email: "support@strapi.io",
  },
}

interface TokenErrorsProps {
  readonly error?: string
  readonly validateToken?: () => void
}

export function TokenErrors({ error, validateToken }: TokenErrorsProps) {
  const details = errorDetails[error ?? ""] ?? defaultError
  const { title, message, buttonText, email } = details

  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <Typography tag="h1" variant="header2">
        {title}
      </Typography>
      <Typography tag="p" variant="body2" textColor="neutral">
        {message}
      </Typography>
      {email ? (
        <AppLink href={`mailto:${email}`} variant="outline">
          {buttonText}
        </AppLink>
      ) : (
        error === "ERR_TOKEN_NOT_FOUND" && (
          <Button type="button" onClick={() => validateToken?.()}>
            <ArrowClockwiseIcon size={20} />
            {buttonText}
          </Button>
        )
      )}
    </div>
  )
}
