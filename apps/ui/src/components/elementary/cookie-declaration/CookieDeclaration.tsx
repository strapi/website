"use client"

import { useEffect, useRef } from "react"

interface CookieDeclarationProps {
  /** Cookiebot domain group id (CBID), e.g. "386813f1-e3fc-470a-838b-20a717371095". */
  readonly cbid: string
}

/**
 * Renders the Cookiebot "Cookie Declaration" — the auto-generated table of every
 * cookie the Cookiebot scan found, grouped by category (Necessary, Preferences,
 * Statistics, Marketing).
 *
 * Cookiebot ships this as a script (`cd.js`) that injects the table where the
 * script tag sits in the DOM. React won't execute an external `<script>` rendered
 * via JSX after hydration, so we append it imperatively into a container ref on
 * mount (client-only). The table is rendered inside that container.
 *
 * The list itself is configured in the Cookiebot dashboard (the automatic domain
 * scan) — this component only provides the mount point.
 */
export function CookieDeclaration({ cbid }: CookieDeclarationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Guard against double-injection (React strict mode / remounts).
    if (container.querySelector("#CookieDeclaration")) return

    const script = document.createElement("script")
    script.id = "CookieDeclaration"
    script.type = "text/javascript"
    script.async = true
    script.src = `https://consent.cookiebot.com/${cbid}/cd.js`
    container.append(script)

    return () => {
      container.innerHTML = ""
    }
  }, [cbid])

  return <div ref={containerRef} />
}
