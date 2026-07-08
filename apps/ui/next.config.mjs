import { STATIC_REDIRECTS } from "@repo/shared-data"
import { withSentryConfig } from "@sentry/nextjs"
import plugin from "next-intl/plugin"

import { env } from "./src/env.mjs"

const withNextIntl = plugin("./src/lib/i18n.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: env.NEXT_OUTPUT,
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  // Enable cacheComponents when caching strategy is introduced
  // cacheComponents: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
    serverActions: {
      /**
       * strapi.io is fronted by AWS CloudFront proxying to this Vercel deployment,
       * so server-action POSTs arrive with Origin: strapi.io but a Vercel host —
       * without this allowlist Next.js CSRF protection rejects them with 403.
       */
      allowedOrigins: [
        "strapi.io",
        "www.strapi.io",
        "website-vercel.strapi.io",
      ],
    },
  },
  reactCompiler: true,
  transpilePackages: ["@repo/design-system"],
  images: {
    // Strapi serves pre-generated responsive variants (thumbnail/small/medium/large).
    // Next.js optimization is disabled to avoid Vercel image-transformation costs;
    // `StrapiBasicImage` builds a native srcSet from `media.formats` so the browser
    // picks the right variant based on viewport + DPR.
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },

  // Turbopack configuration (replaces webpack config)
  // Turbopack has built-in intelligent caching, so no manual cache configuration needed
  // Note: Custom webpack loaders/plugins are not supported in Turbopack

  async redirects() {
    // The table lives in @repo/shared-data so link components can resolve
    // statically-redirected paths at render time (see formatHref) and this
    // config serves the same rules as real HTTP redirects.
    return STATIC_REDIRECTS
  },
}

const withConfig = (() => {
  let config = withNextIntl(nextConfig)

  config = withSentryConfig(config, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Pass org, project and auth token to be able to upload source maps
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // sourcemaps: {
    //   // To disable sourcemap plugin, set this to true
    //   disable: true
    // }

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  })

  return config
})()

export default withConfig
