"use client"

import Script from "next/script"

interface CookieDeclarationProps {
  /** Cookiebot domain group id (CBID), e.g. "386813f1-e3fc-470a-838b-20a717371095". */
  readonly cbid: string
}

export function CookieDeclaration({ cbid }: CookieDeclarationProps) {
  return (
    <Script
      id="CookieDeclaration"
      src={`https://consent.cookiebot.com/${cbid}/cd.js`}
      strategy="lazyOnload"
    />
  )
}
