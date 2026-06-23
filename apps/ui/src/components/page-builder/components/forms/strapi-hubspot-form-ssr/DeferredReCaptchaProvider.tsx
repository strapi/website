"use client"

import { ReCaptchaProvider } from "next-recaptcha-v3"
import { useEffect, useRef, useState } from "react"

interface DeferredReCaptchaProviderProps {
  readonly reCaptchaKey: string
  readonly children: React.ReactNode
}

/**
 * Mounts `ReCaptchaProvider` (which injects Google's ~380KB reCAPTCHA v3 script)
 * only after the user first interacts with the form. Until then the form renders
 * without the provider, keeping the script off the initial page load — a major
 * win for LCP/TBT on every page that embeds a captcha-protected form.
 *
 * By the time the user finishes filling and submits the form the script has had
 * time to load; if it somehow hasn't, the submit handler already tolerates a
 * missing `window.grecaptcha` and proceeds without a token.
 *
 * The wrapper uses `display: contents` so it never affects form layout while
 * still catching bubbling `focusin` / `pointerdown` events from its children.
 */
export function DeferredReCaptchaProvider({
  reCaptchaKey,
  children,
}: DeferredReCaptchaProviderProps) {
  const [activated, setActivated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activated) {
      return
    }

    const el = containerRef.current

    if (!el) {
      return
    }

    const activate = () => setActivated(true)
    const options = { once: true, passive: true } as const

    el.addEventListener("focusin", activate, options)
    el.addEventListener("pointerdown", activate, options)

    return () => {
      el.removeEventListener("focusin", activate)
      el.removeEventListener("pointerdown", activate)
    }
  }, [activated])

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {activated ? (
        <ReCaptchaProvider reCaptchaKey={reCaptchaKey}>
          {children}
        </ReCaptchaProvider>
      ) : (
        children
      )}
    </div>
  )
}
