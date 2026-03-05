import type { TransformFn } from "../transforms/base.ts"
import { remapDynamicZone } from "../transforms/dynamic-zone.ts"
import { dropFields, renameFields } from "../transforms/fields.ts"
import { flattenV4 } from "../transforms/flatten-v4.ts"
import { uploadMedia } from "../transforms/media.ts"
import { transformSeo } from "../transforms/seo.ts"

/**
 * Deep populate config for v4 dynamic zones.
 *
 * Strapi v4 doesn't populate nested components by default.
 * `populate: "*"` only goes 1 level. We need explicit nested populate
 * for every component field that contains sub-components.
 */
const DEEP_DZ_POPULATE = {
  seo: { populate: "*" },
  settings: { populate: "*" },
  slices: {
    populate: {
      // Common nested fields across slice types
      intro: {
        populate: {
          button: { populate: "*" },
          smallTextWithLink: { populate: "*" },
          newsWithLink: { populate: "*" },
        },
      },
      hero: {
        populate: {
          intro: { populate: "*" },
          topRightBackgroundImage: { populate: "*" },
          bottomLeftBackgroundImage: { populate: "*" },
          animation: { populate: "*" },
          animations: { populate: "*" },
          brands: { populate: { brands: { populate: "*" } } },
          features: { populate: "*" },
        },
      },
      gradientHeader: { populate: "*" },
      image: { populate: "*" },
      backgroundImage: { populate: "*" },
      triangleImage: { populate: "*" },

      // Person / author
      author: {
        populate: { image: { populate: "*" }, companyLogo: { populate: "*" } },
      },

      // Nested component arrays
      categories: { populate: { questions: { populate: "*" } } },
      step: { populate: { image: { populate: "*" } } },
      benefits: {
        populate: {
          image: { populate: "*" },
          icon: { populate: "*" },
          link: { populate: "*" },
        },
      },
      cards: {
        populate: {
          image: { populate: "*" },
          icon: { populate: "*" },
          link: { populate: "*" },
        },
      },
      features: {
        populate: { image: { populate: "*" }, icon: { populate: "*" } },
      },
      brands: {
        populate: { image: { populate: "*" }, logo: { populate: "*" } },
      },
      thumbnails: { populate: { image: { populate: "*" } } },

      // Simple nested components
      link: { populate: "*" },
      newsletter: { populate: "*" },
      primaryButton: { populate: "*" },
      secondaryButton: { populate: "*" },
      openPositionsCTA: { populate: "*" },
      topIntegrations: { populate: "*" },

      // Plan-related
      planTypes: { populate: "*" },
      plans: { populate: "*" },
      extraBoxFeatures: { populate: "*" },
      extraBoxLink: { populate: "*" },
    },
  },
}

/** Derive a title from slug if title is missing or null. "headless-cms" → "Headless Cms" */
const ensureTitle: TransformFn = (entity) => {
  const existing = entity["title"]
  if (typeof existing === "string" && existing.length > 0) return entity

  const slug = entity["slug"] as string | undefined
  if (!slug) return { ...entity, title: "Untitled" }

  const lastSegment = slug.split("/").pop() ?? slug
  const title = lastSegment
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())

  return { ...entity, title }
}

export interface EntityMigrationConfig {
  /** v4 API endpoint (without /api/ prefix) */
  sourceEndpoint: string
  /** v4 populate params */
  sourcePopulate: Record<string, unknown> | string
  /** v5 API endpoint (without /api/ prefix) */
  targetEndpoint: string
  /** Field used for dedup lookup in v5 */
  dedupField: string
  /** v4 content type UID (for id-map) */
  sourceUid: string
  /** Ordered transform functions */
  transforms: TransformFn[]
}

export const ENTITY_CONFIGS: Record<string, EntityMigrationConfig> = {
  pages: {
    sourceEndpoint: "universals",
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::universal.universal",
    transforms: [
      flattenV4,
      // Drop v4-only fields
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "darkMode"
      ),
      // Derive title from slug (v4 universals have no title field)
      ensureTitle,
      // Remap dynamic zone: slices → content
      remapDynamicZone("slices", "content"),
      // Transform SEO component
      transformSeo,
      // Rewrite media URLs to absolute
      uploadMedia,
    ],
  },

  plans: {
    sourceEndpoint: "plans",
    sourcePopulate: {
      populate: {
        media: { populate: "*" },
        link: { populate: "*" },
        plans_features: { populate: "*" },
        tooltip: { populate: "*" },
      },
    },
    targetEndpoint: "plans",
    dedupField: "name",
    sourceUid: "api::plan.plan",
    transforms: [
      flattenV4,
      // Map v4 plan fields → v5 plan fields
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        // v4-only fields not in v5
        "theme",
        "media",
        "link",
        "plans_features",
        "plans_custom_features",
        "specialOffer",
        "billedAnnually",
        "oldAnnualPrice",
        "newAnnualPrice",
        "priority",
        "freeTrial",
        "freeTrialText",
        "commandLine",
        "chargebee_id",
        "tooltip",
        "text"
      ),
      renameFields({
        newAnnualPrice: "yearlyPrice",
      }),
      // Ensure required 'type' enum field is set
      ((entity) => {
        if (!entity["type"]) {
          // v4 plans don't have a 'type' field — default to 'cloud' for newer plans, 'cms' for old ones
          entity["type"] = "cloud"
        }

        return entity
      }) as TransformFn,
      uploadMedia,
    ],
  },

  redirects: {
    sourceEndpoint: "redirects",
    sourcePopulate: "*",
    targetEndpoint: "redirects",
    dedupField: "source",
    sourceUid: "api::redirect.redirect",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
    ],
  },

  "blog-posts": {
    sourceEndpoint: "blog-posts",
    sourcePopulate: {
      image: { populate: "*" },
      tags: { populate: "*" },
      seo: { populate: "*" },
    },
    targetEndpoint: "blog-posts",
    dedupField: "slug",
    sourceUid: "api::blog-post.blog-post",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        // v4-only fields not in v5
        "content",
        "card",
        "user",
        "coauthors",
        "featuredCategory",
        "postSubCategory",
        "slices",
        "version",
        "level",
        // coverImage is a media.image component — drop for now (needs media upload)
        "image",
        // tags are v4 relations — need id mapping
        "tags"
      ),
      // Ensure required fields and normalize slug
      ((entity) => {
        if (!entity["title"]) entity["title"] = "Untitled"
        if (!entity["slug"]) entity["slug"] = `post-${Date.now()}`
        // Normalize slug: lowercase, replace dots with hyphens, strip invalid chars
        if (typeof entity["slug"] === "string") {
          entity["slug"] = (entity["slug"] as string)
            .toLowerCase()
            .replaceAll(".", "-")
            .replaceAll(/[^a-z0-9-]/g, "")
            .replaceAll(/-+/g, "-")
            .replaceAll(/^-|-$/g, "")
        }

        return entity
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "blog-categories": {
    sourceEndpoint: "post-categories",
    sourcePopulate: "*",
    targetEndpoint: "blog-categories",
    dedupField: "slug",
    sourceUid: "api::post-category.post-category",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "blogPosts",
        "image",
        "post_sub_categories",
        "seo"
      ),
    ],
  },

  "blog-tags": {
    sourceEndpoint: "post-tags",
    sourcePopulate: "*",
    targetEndpoint: "blog-tags",
    dedupField: "slug",
    sourceUid: "api::post-tag.post-tag",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "blogPosts",
        "blog_posts"
      ),
    ],
  },

  authors: {
    sourceEndpoint: "blog-posts",
    sourcePopulate: {
      populate: {
        user: { populate: "*" },
      },
    },
    targetEndpoint: "authors",
    dedupField: "slug",
    sourceUid: "virtual::author",
    transforms: [
      // Authors are extracted from blog-post user relations in a custom pipeline step
      // This config is a placeholder — actual extraction requires custom logic
      flattenV4,
    ],
  },
}
