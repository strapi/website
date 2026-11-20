import type { HubSpotSubmitContext } from "@/lib/hubspot"

/**
 * Browser-only. The HubSpot `context` for a form submit: the page and the
 * `hubspotutk` visitor cookie. With `hutk`, HubSpot links the contact to the
 * visitor's page views, UTMs and original source.
 *
 * `hutk` is sent only when the visitor accepted "marketing" cookies in
 * Cookiebot. With no Cookiebot (local, previews), it is sent when it exists.
 */
export function getHubSpotContext(): HubSpotSubmitContext {
  const cookiebot = (
    window as { Cookiebot?: { consent?: { marketing?: boolean } } }
  ).Cookiebot
  const hasConsent = !cookiebot || cookiebot.consent?.marketing === true
  const hutk = hasConsent
    ? /(?:^|;\s*)hubspotutk=([^;]+)/.exec(document.cookie)?.[1]
    : undefined

  return {
    pageUri: window.location.href,
    pageName: document.title,
    ...(hutk && { hutk }),
  }
}
