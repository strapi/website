import fs from "node:fs"
import path from "node:path"

const EXCLUDED_CONTENT_TYPES: Set<string> = new Set()

/**
 * Auto-discovers API content types from `src/api/` — only includes
 * directories that have a `content-types` subdirectory.
 */
function getApiContentTypes(): string[] {
  const apiDir = path.join(__dirname, "..", "src", "api")

  return fs
    .readdirSync(apiDir)
    .filter((name) => {
      // eslint-disable-next-line sonarjs/no-empty-collection
      if (name.includes(".") || EXCLUDED_CONTENT_TYPES.has(name)) {
        return false
      }

      return fs.existsSync(path.join(apiDir, name, "content-types"))
    })
    .map((name) => `api::${name}.${name}`)
}

export default ({ env }) => {
  return {
    "config-sync": {
      enabled: true,
    },

    seo: {
      enabled: true,
    },

    "users-permissions": {
      config: {
        jwt: {
          expiresIn: "30d", // this value is synced with Better Auth session maxAge
        },
      },
    },

    // Max dimensions (fit: inside) for responsive variants generated on upload.
    // Aligned with design-system breakpoints + 2x retina: sm=640, lg=1024, 2xl=1536.
    // Thumbnail (245×156) is hardcoded in @strapi/upload and not configurable here.
    upload: {
      config: {
        breakpoints: {
          small: 640,
          medium: 1024,
          large: 1536,
        },
      },
    },

    sentry: {
      enabled: true,
      config: {
        // Only set `dsn` property in production
        dsn: env("NODE_ENV") === "production" ? env("SENTRY_DSN") : null,
        sendMetadata: true,
      },
    },

    meilisearch: {
      config: {
        host: env("MEILISEARCH_HOST", "http://localhost:7700"),
        apiKey: env("MEILISEARCH_API_KEY"),
        "case-study": {
          indexName: env.bool("MEILISEARCH_PRODUCTION", false)
            ? "case-studies-production"
            : "case-studies-testing",
          entriesQuery: {
            populate: {
              coverImage: {
                populate: { image: { populate: { media: true } } },
              },
              categories: { fields: ["name", "slug"] },
            },
          },
          settings: {
            filterableAttributes: ["categories.slug"],
            searchableAttributes: ["title", "companyName", "description"],
            sortableAttributes: ["originalPublishedAt"],
          },
        },
        page: {
          indexName: env.bool("MEILISEARCH_PRODUCTION", false)
            ? "pages-production"
            : "pages-testing",
          transformEntry({ entry }) {
            return {
              ...entry,
              pageType:
                typeof entry.fullPath === "string" &&
                entry.fullPath.startsWith("/features")
                  ? "feature"
                  : "page",
            }
          },
          settings: {
            filterableAttributes: ["pageType", "locale"],
          },
        },
        "blog-post": {
          indexName: env.bool("MEILISEARCH_PRODUCTION", false)
            ? "blog-posts-production"
            : "blog-posts-testing",
        },
      },
    },

    // Must be last — registers after custom field plugins (color-picker) to avoid #119
    // https://github.com/strapi-community/plugin-rest-cache/issues/119
    "rest-cache": {
      enabled: true,
      config: {
        provider: {
          name: "memory",
          options: {
            max: 32767,
            maxAge: 3600000, // 1 hour
          },
        },
        strategy: {
          keysPrefix: "strapi-website",
          maxAge: 3600000,
          debug: env("NODE_ENV") !== "production",
          resetOnStartup: true,
          clearRelatedCache: true,
          enableEtag: true,
          enableXCacheHeaders: true,
          // Allow caching of API-token requests (same data for all callers).
          // Only skip cache for session cookies (admin panel).
          hitpass: (ctx) => Boolean(ctx.request.header.cookie),
          contentTypes: getApiContentTypes(),
        },
      },
    },
  }
}
