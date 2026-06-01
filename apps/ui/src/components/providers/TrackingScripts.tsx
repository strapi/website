import { GoogleTagManager } from "@next/third-parties/google"
import Script from "next/script"

import { env } from "@/env.mjs"
import { isDevelopment } from "@/lib/general-helpers"

export function TrackingScriptWrapper({
  id,
  scriptContent,
  scriptOptions,
  ignoreInDevelopment = true,
}: {
  scriptContent: string
  id: string
  scriptOptions: Exclude<
    React.ComponentProps<typeof Script>,
    "id" | "dangerouslySetInnerHTML"
  >
  ignoreInDevelopment?: boolean
}) {
  if (ignoreInDevelopment && isDevelopment()) {
    return null
  }

  return (
    <Script
      id={id}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      {...scriptOptions}
    />
  )
}

export function TrackingScripts() {
  if (isDevelopment()) {
    return null
  }

  return (
    <>
      {env.COOKIEBOT_ID && (
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid={env.COOKIEBOT_ID}
          data-blockingmode="auto"
          strategy="beforeInteractive"
        />
      )}

      {env.GTM_ID && <GoogleTagManager gtmId={env.GTM_ID} />}

      {env.HUBSPOT_PORTAL_ID && (
        <Script
          data-cookieconsent="marketing"
          id="hs-script-loader"
          src={`//js.hs-scripts.com/${env.HUBSPOT_PORTAL_ID}.js`}
          strategy="afterInteractive"
        />
      )}

      {env.HOTJAR_ID && (
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${env.HOTJAR_ID},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      )}

      {/* Global button click tracking via data-slot attribute (requires GTM) */}
      {env.GTM_ID && (
        <Script id="button-click-tracking" strategy="afterInteractive">
          {`document.addEventListener('click',function(e){
              var target=e.target;
              if(!(target instanceof Element)){return;}
              var btn=target.closest('[data-slot="button"]');
              if(btn&&btn.innerText){
                window.dataLayer=window.dataLayer||[];
                window.dataLayer.push({event:'button_click',button_text:btn.innerText});
              }
            });`}
        </Script>
      )}
    </>
  )
}
