"use client"

import Script from "next/script"

import { LoadAfterIdle } from "./LoadAfterIdle"

interface KapaWidgetProps {
  readonly websiteId: string
}

/**
 * Loads the Kapa AI support widget far off the critical path.
 *
 * The bundle is large enough (~2MB) that parsing it during the initial load
 * window starves the main thread right when the hero needs to render and run
 * its reveal animation — which was ballooning the homepage's lab LCP (the LCP
 * element is opacity-animated, so it only "appears" once the main thread is
 * free to start the animation). The assistant button simply
 * shows up a few seconds in, which is fine for a support widget.
 */
export function KapaWidget({ websiteId }: KapaWidgetProps) {
  return (
    <LoadAfterIdle delayMs={3000}>
      <Script
        id="kapa-widget"
        src="https://widget.kapa.ai/kapa-widget.bundle.js"
        data-website-id={websiteId}
        data-project-name="Strapi"
        data-project-color="#4945FF"
        data-project-logo="https://automatic-life-0194aa0342.media.strapiapp.com/w_1920_quality_90_fit_scale_down_bc0b380e22.webp"
        data-modal-disclaimer="Disclaimer: Answers are AI-generated and might be inaccurate. Please ensure you double-check the information provided by visiting source pages."
        data-modal-example-questions="How to create a Strapi project?,How does population work?,How to customize the admin panel?,Explain the Growth plan benefits"
        data-modal-title-ask-ai="Ask your question"
        data-button-bg-color="#32324D"
        data-submit-query-button-bg-color="#4945FF"
        data-modal-border-radius="4px"
        data-modal-body-padding-top="20px"
        data-modal-size="900px"
        data-modal-full-screen="false"
        data-modal-full-screen-on-mobile="true"
        data-modal-x-offset="0"
        data-modal-y-offset="3vh"
        data-modal-inner-max-width="100%"
        data-modal-z-index="10000"
        data-user-analytics-cookie-enabled="true"
        strategy="afterInteractive"
      />
    </LoadAfterIdle>
  )
}
