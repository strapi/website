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

/**
 * Koa may parse a repeated query param into an array, so handle both shapes.
 */
function isDraftStatusQuery(status: unknown): boolean {
  if (Array.isArray(status)) {
    return status.includes("draft")
  }

  return status === "draft"
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
        providerOptions: {
          localServer: {
            maxage: 31536000000,
            immutable: true,
          },
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
              logoImage: {
                populate: { image: { populate: { media: true } } },
              },
              categories: { fields: ["name", "slug"] },
            },
          },
          settings: {
            // categories.name is faceted to drive the search sidebar checkboxes;
            // categories.slug kept filterable for any slug-based filtering.
            filterableAttributes: ["categories.slug", "categories.name"],
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
        feature: {
          indexName: env.bool("MEILISEARCH_PRODUCTION", false)
            ? "features-production"
            : "features-testing",
          entriesQuery: {
            populate: {
              icon: true,
              feature_category: { fields: ["title"] },
            },
          },
          transformEntry({ entry }) {
            return {
              ...entry,
              feature_category: entry.feature_category?.title ?? null,
            }
          },
          settings: {
            filterableAttributes: ["feature_category"],
            searchableAttributes: ["title", "description"],
          },
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
          // Skip cache for session cookies (admin panel) and for draft reads:
          // draft saves never reset this cache (only publish does, via the
          // revalidate service), so a cached `?status=draft` response would
          // pin the Next.js preview to a stale draft for up to 1 hour.
          hitpass: (ctx) =>
            Boolean(ctx.request.header.cookie) ||
            isDraftStatusQuery(ctx.query?.status),
          contentTypes: getApiContentTypes(),
        },
      },
    },
  }
}
