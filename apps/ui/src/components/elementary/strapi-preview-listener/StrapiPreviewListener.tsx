"use client"

import { useEffect } from "react"

import { hashStringSHA256 } from "@/lib/crypto"
import { useRouter } from "@/lib/navigation"

/**
 * Bridges the Strapi admin preview panel and this app when the site runs
 * inside the panel's iframe (Growth/EE plans).
 *
 * Current Strapi 5 contract (docs.strapi.io/cms/features/preview):
 *  1. The iframe must announce itself with a `previewReady` postMessage —
 *     without it the admin panel never wires up the save → refresh loop.
 *  2. The panel then sends `strapiScript` (its live-preview script to inject)
 *     and `strapiUpdate` (an entry was saved → re-render with fresh data).
 */
export function StrapiPreviewWindowChangeListener({
  hashedAllowedReloadOrigin, // to avoid bundling strapi URL, we pass this as a hash from SSR parent
}: {
  hashedAllowedReloadOrigin: string
}) {
  const router = useRouter()

  useEffect(() => {
    // Not embedded — a regular visitor tab has no admin panel to talk to.
    if (window.parent === window) {
      return
    }

    const handleMessage = async (message: MessageEvent) => {
      const type: unknown = message.data?.type

      if (type !== "strapiUpdate" && type !== "strapiScript") {
        return // The order is important -> keep the cheap check before hashing
      }

      /**
       * Filters events emitted through the postMessage() API.
       * The origin is checked based on a hashed value to avoid sharing the
       * strapi URL in the client-side bundle.
       */
      if (
        (await hashStringSHA256(message.origin)) !== hashedAllowedReloadOrigin
      ) {
        return
      }

      if (type === "strapiUpdate") {
        router.refresh()
      } else {
        const script = window.document.createElement("script")
        script.textContent = message.data.payload?.script ?? ""
        window.document.head.append(script)
      }
    }

    window.addEventListener("message", handleMessage)

    // Handshake: let the admin panel know the iframe is ready to be driven.
    window.parent.postMessage({ type: "previewReady" }, "*")

    return () => {
      window.removeEventListener("message", handleMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashedAllowedReloadOrigin])

  return null
}
