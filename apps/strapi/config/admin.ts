import type { UID } from "@strapi/strapi"

import type { StrapiPreviewConfig } from "../types/internals"

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

  return {
    auth: {
      secret: env("ADMIN_JWT_SECRET"),
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
