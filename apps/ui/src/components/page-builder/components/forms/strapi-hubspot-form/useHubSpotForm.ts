import { useEffect, useRef, useState } from "react"

const HUBSPOT_SCRIPT_SRC = "https://js.hsforms.net/forms/v2.js"
const HUBSPOT_RENDER_TIMEOUT_MS = 10000

let hubspotScriptPromise: Promise<void> | undefined

export type HubSpotFormStatus = "error" | "loading" | "ready"

function getHubSpotScript() {
  return document.querySelector<HTMLScriptElement>(
    `script[src="${HUBSPOT_SCRIPT_SRC}"]`
  )
}

function loadScript() {
  if (window.hbspt?.forms) {
    return Promise.resolve()
  }

  if (hubspotScriptPromise) {
    return hubspotScriptPromise
  }

  hubspotScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = getHubSpotScript()
    const script = existingScript ?? document.createElement("script")

    if (existingScript?.dataset.loaded === "true") {
      resolve()

      return
    }

    const cleanup = () => {
      script.removeEventListener("load", handleLoad)
      script.removeEventListener("error", handleError)
    }

    const handleLoad = () => {
      cleanup()
      script.dataset.loaded = "true"
      resolve()
    }

    const handleError = () => {
      cleanup()
      delete script.dataset.loaded
      hubspotScriptPromise = undefined
      reject(new Error("Failed to load HubSpot forms script."))
    }

    script.addEventListener("load", handleLoad)
    script.addEventListener("error", handleError)

    if (!existingScript) {
      script.src = HUBSPOT_SCRIPT_SRC
      script.async = true
      document.head.append(script)
    }
  })

  return hubspotScriptPromise
}

function hasRenderedForm(container: HTMLDivElement) {
  return (
    container.childElementCount > 0 || container.textContent?.trim().length > 0
  )
}

/**
 * Hook to create a HubSpot form embed.
 */
export function useHubSpotForm(portalId: string, formId: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<HubSpotFormStatus>("loading")

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false
    let hasCompleted = false
    let observer: MutationObserver | undefined
    let timeoutId: number | undefined

    const clearPendingWork = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
        timeoutId = undefined
      }

      observer?.disconnect()
      observer = undefined
    }

    const finish = (nextStatus: HubSpotFormStatus) => {
      if (cancelled || hasCompleted) {
        return
      }

      hasCompleted = true
      clearPendingWork()
      setStatus(nextStatus)
    }

    container.replaceChildren()

    observer = new MutationObserver(() => {
      if (hasRenderedForm(container)) {
        finish("ready")
      }
    })

    observer.observe(container, { childList: true, subtree: true })

    timeoutId = window.setTimeout(() => {
      finish("error")
    }, HUBSPOT_RENDER_TIMEOUT_MS)

    const scriptPromise = loadScript()

    scriptPromise
      .then(() => {
        if (cancelled || hasCompleted) {
          return
        }

        if (!window.hbspt?.forms) {
          finish("error")

          return
        }

        if (hasRenderedForm(container)) {
          finish("ready")

          return
        }

        try {
          window.hbspt.forms.create({
            portalId,
            formId,
            target: `#${container.id}`,
          })
        } catch {
          finish("error")
        }
      })
      .catch(() => {
        finish("error")
      })

    return () => {
      cancelled = true
      clearPendingWork()
    }
  }, [portalId, formId])

  return { containerRef, status }
}
