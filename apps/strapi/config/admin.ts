import type { Core, UID } from "@strapi/strapi"
import { Strategy as GoogleStrategy } from "passport-google-oauth2"

import type { StrapiPreviewConfig } from "../types/internals"

interface GoogleProfile {
  email: string
  given_name?: string
  family_name?: string
}

export default ({ env }) => {
  const strapiPreviewConfig: StrapiPreviewConfig = {
    enabled: env("STRAPI_PREVIEW_ENABLED") === "true",
    previewSecret: env("STRAPI_PREVIEW_SECRET"),
    clientUrl: env("CLIENT_URL"),
    enabledContentTypeUids: [
      "api::page.page",
      "api::blog-post.blog-post",
      "api::case-study.case-study",
      "api::cms-comparison.cms-comparison",
      "api::post-category.post-category",
      "api::post-tag.post-tag",
    ],
  }

  /**
   * Google admin-panel SSO. Only registered when credentials are present, so
   * local dev (and any env without the secrets) boots normally with plain
   * email/password login. The callback URL is derived from the server `url`
   * config (`APP_URL`) → `<APP_URL>/admin/connect/google`, which must be added
   * as an authorized redirect URI in the Google Cloud OAuth client.
   */
  const googleClientId = env("GOOGLE_CLIENT_ID")
  const googleClientSecret = env("GOOGLE_CLIENT_SECRET")
  const ssoProviders =
    googleClientId && googleClientSecret
      ? [
          {
            uid: "google",
            displayName: "Google",
            // Inline data URI (official Google "G" mark) so the login button
            // renders without depending on a third-party CDN. `data:` is already
            // allowed by the CSP `img-src` directive in config/middlewares.ts.
            icon: "https://automatic-life-0194aa0342.media.strapiapp.com/integrations_logo_google_88cd50d2db.png",
            createStrategy: (strapi: Core.Strapi) =>
              new GoogleStrategy(
                {
                  clientID: googleClientId,
                  clientSecret: googleClientSecret,
                  scope: [
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/userinfo.profile",
                  ],
                  callbackURL:
                    strapi.admin.services.passport.getStrategyCallbackURL(
                      "google"
                    ),
                  // passport-google-oauth2 always passes `request` as the first
                  // verify arg; this selects the matching strategy overload.
                  passReqToCallback: true,
                },
                (
                  _request: unknown,
                  _accessToken: string,
                  _refreshToken: string,
                  profile: GoogleProfile,
                  done: (error: unknown, user?: unknown) => void
                ) => {
                  done(null, {
                    email: profile.email,
                    firstname: profile.given_name,
                    lastname: profile.family_name,
                  })
                }
              ),
          },
        ]
      : []

  return {
    auth: {
      secret: env("ADMIN_JWT_SECRET"),
      sessions: {
        accessTokenLifespan: 60 * 60 * 12, // 12 hours (default 30 min)
        maxSessionLifespan: 60 * 60 * 24 * 7, // 7 days (default 1 day)
        idleSessionLifespan: 60 * 60 * 24, // 24 hours (default 2 hours)
        maxRefreshTokenLifespan: 60 * 60 * 24 * 30, // 30 days (default)
        idleRefreshTokenLifespan: 60 * 60 * 24 * 14, // 14 days (default)
      },
      ...(ssoProviders.length > 0 ? { providers: ssoProviders } : {}),
    },
    apiToken: {
      salt: env("API_TOKEN_SALT"),
    },
    transfer: {
      token: {
        salt: env("TRANSFER_TOKEN_SALT"),
      },
    },
    preview: {
      enabled: strapiPreviewConfig.enabled,
      config: {
        allowedOrigins: env("CLIENT_URL"),
        handler: async (
          uid: UID.CollectionType,
          { documentId, locale, status }
        ) => {
          // Fetch the complete document from Strapi
          if (
            !strapiPreviewConfig.enabledContentTypeUids.includes(uid) ||
            typeof strapiPreviewConfig.previewSecret !== "string" ||
            typeof strapiPreviewConfig.clientUrl !== "string"
          ) {
            return null
          }
          const document = await strapi
            .documents(uid)
            .findOne({ documentId, locale })

          // Build preview pathname based on content type
          const pathname = getPreviewPathname(uid, document)
          if (!pathname) {
            return null // returning null disables the preview button in the UI
          }
          // Use Next.js draft mode passing it a secret key and the content-type status
          const urlSearchParams = new URLSearchParams({
            url: pathname,
            locale,
            secret: strapiPreviewConfig.previewSecret,
            status,
          })

          return `${strapiPreviewConfig.clientUrl}/api/preview?${urlSearchParams}`
        },
      },
    },
    watchIgnoreFiles: ["**/config/sync/**"],
  }
}

function getPreviewPathname(
  uid: UID.CollectionType,
  document: Record<string, unknown> | null
): string | null {
  if (!document) return null

  switch (uid) {
    case "api::page.page":
      return (document.fullPath as string) || null

    case "api::blog-post.blog-post":
      return document.slug ? `/blog/${document.slug}` : null

    case "api::case-study.case-study":
      return document.slug ? `/user-stories/${document.slug}` : null

    case "api::cms-comparison.cms-comparison":
      return document.slug ? `/headless-cms/comparison/${document.slug}` : null

    case "api::post-category.post-category":
      return document.slug ? `/blog/categories/${document.slug}` : null

    case "api::post-tag.post-tag":
      return document.slug ? `/blog/tags/${document.slug}` : null

    default:
      return null
  }
}
