import "@/styles/globals.css"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { ErrorBoundary } from "@/components/elementary/ErrorBoundary"
import { StrapiPreviewListener } from "@/components/elementary/strapi-preview-listener"
import { TailwindIndicator } from "@/components/elementary/TailwindIndicator"
import { StrapiFooter } from "@/components/page-builder/single-types/footer/StrapiFooter"
import { StrapiHeader } from "@/components/page-builder/single-types/header/StrapiHeader"
import { ClientProviders } from "@/components/providers/ClientProviders"
import { ServerProviders } from "@/components/providers/ServerProviders"
import { TrackingScripts } from "@/components/providers/TrackingScripts"
import { Toaster } from "@/components/ui/sonner"
import { debugStaticParams } from "@/lib/build"
import { fontPoppins } from "@/lib/fonts"
import { routing } from "@/lib/navigation"
import { cn } from "@/lib/styles"

export function generateStaticParams() {
  const locales = routing.locales.map((locale) => ({ locale }))
  debugStaticParams(locales, "[locale]")

  return locales
}

export const metadata: Metadata = {
  title: {
    template: "%s / Notum Technologies",
    default: "",
  },
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale }

  // Enable static rendering
  // https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering
  setRequestLocale(locale)

  if (!routing.locales.includes(locale)) {
    notFound()
  }

  /**
   * This allows you to make following env variables RUNTIME.
   *
   * Following variables aren't going to be embedded during the build-time. To avoid embedding,
   * you must not use "NEXT_PUBLIC_" prefix for env variable that you want to keep
   * private and dynamic at runtime.
   *
   * Instead, use this method to pass only the required env variables to the client side.
   * To access them from CSR or SSR context, read them using `getEnvVar()` helper.
   *
   * Do not include "STRAPI_URL", we want to keep it private (hence why we use proxying).
   */
  const CSR_ENVs = [
    "NODE_ENV",
    "DEBUG_STRAPI_CLIENT_API_CALLS",
    "SHOW_NON_BLOCKING_ERRORS",
    "APP_PUBLIC_URL",
  ]

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="csr-config" strategy="beforeInteractive">
          {`
         window.CSR_CONFIG = window.CSR_CONFIG || {};
         window.CSR_CONFIG = ${JSON.stringify({
           ...CSR_ENVs.reduce(
             (acc, curr) => {
               acc[curr] = process.env?.[curr]

               return acc
             },
             {} as Record<string, string | undefined>
           ),
         })};
       `}
        </Script>
      </head>
      <body
        className={cn(
          "text-foreground min-h-screen bg-white font-sans",
          fontPoppins.variable
        )}
      >
        <TrackingScripts />
        <ServerProviders>
          <StrapiPreviewListener />
          <ClientProviders>
            <div className="relative flex min-h-screen flex-col">
              {/*
                data-slot wrappers: targeted by CSS `:has([data-minimal-layout])`
                in globals.css to hide header/footer on pages with minimalLayout
                enabled. Header/footer stay in the layout (not moved to page level)
                to preserve navigation state across client-side page transitions.
                See StrapiPageView for the full explanation.
              */}
              <div data-slot="site-header">
                <ErrorBoundary showErrorMessage>
                  <StrapiHeader locale={locale} />
                </ErrorBoundary>
              </div>

              <div className="flex-1">{children}</div>

              <TailwindIndicator />

              <Toaster />

              <div data-slot="site-footer">
                <ErrorBoundary hideFallback>
                  <StrapiFooter locale={locale} />
                </ErrorBoundary>
              </div>
            </div>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
