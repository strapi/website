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
    return [
      { source: "/cloud-legal", destination: "/legal", permanent: true },
      {
        source: "/community-stars",
        destination:
          "https://community.strapi.io/members?members:createdAt:desc[toggle][community_star]=true",
        permanent: true,
      },
      {
        source: "/contact-sales-cloud",
        destination: "https://strapi.io/contact-sales",
        permanent: true,
      },
      {
        source: "/content-architecture",
        destination: "https://strapi.io/content-management",
        permanent: true,
      },
      {
        source: "/content-videos",
        destination: "https://www.youtube.com/@Strapi/videos",
        permanent: true,
      },
      {
        source: "/culture",
        destination: "https://handbook.strapi.io/",
        permanent: true,
      },
      {
        source: "/culture-code",
        destination: "https://handbook.strapi.io/",
        permanent: true,
      },
      {
        source: "/discovery",
        destination: "/headless-cms/comparaison",
        permanent: true,
      },
      { source: "/five", destination: "/", permanent: true },
      { source: "/get-license", destination: "/pricing", permanent: true },
      {
        source: "/integrations",
        destination: "https://community.strapi.io/integrations",
        permanent: true,
      },
      { source: "/launch-week", destination: "/five", permanent: true },
      {
        source: "/legacy-community-stars",
        destination:
          "https://community.strapi.io/members?members:createdAt:desc[toggle][community_star]=true",
        permanent: true,
      },
      {
        source: "/market-guidelines",
        destination: "https://community.strapi.io/market-guidelines",
        permanent: true,
      },
      {
        source: "/nuxtnation",
        destination: "https://strapi.io/integrations/nuxtjs-cms",
        permanent: true,
      },
      {
        source: "/oldv4",
        destination: "https://docs-v4.strapi.io/dev-docs/migration-guides",
        permanent: true,
      },
      {
        source: "/open-collective-gift-card-redeemed",
        destination: "/",
        permanent: true,
      },
      { source: "/order-confirmation", destination: "/", permanent: true },
      {
        source: "/partners",
        destination: "https://community.strapi.io/partners",
        permanent: true,
      },
      {
        source: "/plugin-resources",
        destination: "https://community.strapi.io/",
        permanent: true,
      },
      {
        source: "/premium-support",
        destination: "https://strapi.io/security",
        permanent: true,
      },
      {
        source: "/resource-center",
        destination: "https://docs.strapi.io",
        permanent: true,
      },
      {
        source: "/security-guide",
        destination: "https://strapi.io/security",
        permanent: true,
      },
      {
        source: "/showcases",
        destination: "https://community.strapi.io/showcases",
        permanent: true,
      },
      {
        source: "/solutions",
        destination: "https://strapi.io/solutions/corporate-website-cms",
        permanent: true,
      },
      {
        source: "/strapi-conf-2021-videos",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-consumer-services-retail-ecommerce-cms",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-financial-services-headless-cms",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-gaming-cms-leaderboards-community-platform",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-it-tech-services-developer-headless-cms",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-marketing-advertising-cms-campaign-management",
        destination: "/",
        permanent: true,
      },
      {
        source: "/strapi-media-companies-content-distribution-cms",
        destination: "/",
        permanent: true,
      },
      { source: "/strapi-recipes", destination: "/", permanent: true },
      {
        source: "/strapi-reseller-agreement",
        destination: "/legal",
        permanent: true,
      },
      {
        source: "/strapi-retail-ecommerce-omnichannel-product-cms",
        destination: "https://strapi.io/solutions/ecommerce-cms",
        permanent: true,
      },
      {
        source: "/strapi-telecommunications-customer-portal-cms",
        destination: "/",
        permanent: true,
      },
      {
        source: "/support",
        destination: "https://support.strapi.io/",
        permanent: true,
      },
      { source: "/thank-you", destination: "/", permanent: true },
      {
        source: "/the-best-headless-cms-for-seo",
        destination: "/for-content-teams",
        permanent: true,
      },
      { source: "/v4", destination: "/v5", permanent: true },
      {
        source: "/video-library",
        destination: "https://www.youtube.com/@Strapi/videos",
        permanent: true,
      },
      { source: "/what-is-headless-cms", destination: "/", permanent: true },
      { source: "/why-strapi", destination: "/", permanent: true },
      {
        source: "/write-for-the-community",
        destination: "/community",
        permanent: true,
      },
      {
        source: "/youtube-creator-highlight",
        destination: "/community",
        permanent: true,
      },

      // Wildcard rules - keep last
      {
        source: "/integrations/:page*",
        destination: "https://community.strapi.io/integrations/:page*",
        permanent: true,
      },
      {
        source: "/partners/:page*",
        destination: "https://community.strapi.io/:page*",
        permanent: true,
      },
      {
        source: "/showcases/:page*",
        destination: "https://community.strapi.io/showcases",
        permanent: true,
      },
    ]
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
