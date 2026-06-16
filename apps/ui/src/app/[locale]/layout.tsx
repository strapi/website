import "@/styles/globals.css"

import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ErrorBoundary } from "@/components/elementary/ErrorBoundary"
import { StrapiPreviewListener } from "@/components/elementary/strapi-preview-listener"
import { TailwindIndicator } from "@/components/elementary/TailwindIndicator"
import { StrapiStructuredData } from "@/components/page-builder/components/seo-utilities/StrapiStructuredData"
import { StrapiFooter } from "@/components/page-builder/single-types/footer/StrapiFooter"
import { StrapiHeader } from "@/components/page-builder/single-types/header/StrapiHeader"
import { ClientProviders } from "@/components/providers/ClientProviders"
import { ServerProviders } from "@/components/providers/ServerProviders"
import { TrackingScripts } from "@/components/providers/TrackingScripts"
import { Toaster } from "@/components/ui/sonner"
import { debugStaticParams } from "@/lib/build"
import { getEnvVar } from "@/lib/env-vars"
import { fontPoppins } from "@/lib/fonts"
import { routing } from "@/lib/navigation"
import { buildOrgWebsiteGraph } from "@/lib/structured-data/site-graph"
import { cn } from "@/lib/styles"

export function generateStaticParams() {
  const locales = routing.locales.map((locale) => ({ locale }))
  debugStaticParams(locales, "[locale]")

  return locales
}

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "",
  },

  /**
   * Site-wide favicon set. Defined on the root layout so every route inherits
   * it — Next.js shallow-merges metadata, so pages that don't set `icons`
   * (not-found, dev, error boundaries) still get these.
   */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",

  // TODO: REMOVE BEFORE PRODUCTION DEPLOY — site-wide noindex/nofollow while
  // hosted on a non-production URL. Drop this `robots` field entirely.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#4945ff",
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
   * Global Organization + WebSite JSON-LD, emitted once on every route so the
   * whole site exposes the same baseline structured data the legacy strapi.io
   * site had. Per-page `WebPage` nodes (rendered by each page view) link back to
   * these via `@id`.
   */
  const t = await getTranslations({ locale, namespace: "seo" })
  const siteUrl = getEnvVar("APP_PUBLIC_URL")
  const siteGraph = siteUrl
    ? buildOrgWebsiteGraph({
        siteUrl,
        name: t("og.siteName"),
        description: t("metaDescription"),
        locale,
      })
    : null

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
        {siteGraph && (
          <StrapiStructuredData
            structuredData={siteGraph}
            id="siteOrganizationWebsite"
          />
        )}
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
