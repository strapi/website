import { useEffect, useRef, useState } from "react"

const HUBSPOT_SCRIPT_SRC = "https://js.hsforms.net/forms/v2.js"

function loadScript() {
  if (document.querySelector(`script[src="${HUBSPOT_SCRIPT_SRC}"]`)) {
    return
  }

  const script = document.createElement("script")
  script.src = HUBSPOT_SCRIPT_SRC
  script.async = true
  document.head.append(script)
}

/**
 * Hook to create a HubSpot form embed.
 */
export function useHubSpotForm(portalId: string, formId: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false

    const createForm = () => {
      if (cancelled) {
        return
      }

      if (!window.hbspt?.forms) {
        return
      }

      if (container.querySelector("iframe")) {
        return
      }

      window.hbspt.forms.create({
        portalId,
        formId,
        target: `#${container.id}`,
      })
    }

    loadScript()

    const interval = setInterval(() => {
      createForm()

      if (container.querySelector("iframe")) {
        clearInterval(interval)
        setIsLoaded(true)
      }
    }, 250)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [portalId, formId])

  return { containerRef, isLoaded }
}
