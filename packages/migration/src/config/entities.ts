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

  // ─── Case Studies ───

  "case-studies": {
    sourceEndpoint: "case-studies",
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "case-studies",
    dedupField: "slug",
    sourceUid: "api::case-study.case-study",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings"
      ),
      // TODO: map v4 whiteHero, coverImage, case_study_use_cases → v5 fields
      // TODO: remap slices → content dynamic zone
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  "case-study-categories": {
    sourceEndpoint: "case-study-use-cases",
    sourcePopulate: "*",
    targetEndpoint: "case-study-categories",
    dedupField: "name",
    sourceUid: "api::case-study-use-case.case-study-use-case",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // TODO: map v4 case-study-use-case fields → v5 case-study-category (name, slug)
    ],
  },

  // ─── Integrations ───

  integrations: {
    sourceEndpoint: "integrations",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      logo: { populate: "*" },
      image: { populate: "*" },
      link: { populate: "*" },
      integration_topics: { populate: "*" },
      integration_tags: { populate: "*" },
    },
    targetEndpoint: "integrations",
    dedupField: "slug",
    sourceUid: "api::integration.integration",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        // v4-only relation fields — need id mapping
        "integration_topics",
        "integration_tags",
        "user"
      ),
      // TODO: map v4 fields → v5 (logo, image, link components; content richtext)
      // TODO: remap slices → sections dynamic zone
      remapDynamicZone("slices", "sections"),
      transformSeo,
      uploadMedia,
    ],
  },

  "integration-categories": {
    sourceEndpoint: "integration-tags",
    sourcePopulate: "*",
    targetEndpoint: "integration-categories",
    dedupField: "name",
    sourceUid: "api::integration-tag.integration-tag",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // TODO: map v4 integration-tag fields → v5 integration-category (name, slug)
    ],
  },

  // ─── Partners ───

  partners: {
    sourceEndpoint: "partners",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      hero: { populate: "*" },
      intro: { populate: "*" },
      logo: { populate: "*" },
      services: { populate: "*" },
      techStacks: { populate: "*" },
    },
    targetEndpoint: "partners",
    dedupField: "slug",
    sourceUid: "api::partner.partner",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        // v4-only relation fields — need id mapping
        "services",
        "techStacks",
        "location"
      ),
      // TODO: map v4 hero, intro, logo → v5 fields
      // TODO: map v4 location → v5 city/country relations
      // TODO: remap slices → sections dynamic zone
      remapDynamicZone("slices", "sections"),
      transformSeo,
      uploadMedia,
    ],
  },

  "partner-services": {
    sourceEndpoint: "partner-services",
    sourcePopulate: "*",
    targetEndpoint: "partner-services",
    dedupField: "name",
    sourceUid: "api::partner-service.partner-service",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
    ],
  },

  // ─── Taxonomy / lookup tables ───

  countries: {
    sourceEndpoint: "countries",
    sourcePopulate: "*",
    targetEndpoint: "countries",
    dedupField: "name",
    sourceUid: "api::country.country",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "flag",
        "cities"
      ),
    ],
  },

  cities: {
    sourceEndpoint: "cities",
    sourcePopulate: {
      country: { populate: "*" },
    },
    targetEndpoint: "cities",
    dedupField: "name",
    sourceUid: "api::city.city",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "users",
        "country"
      ),
      // TODO: map v4 country relation → v5 country relation (needs id mapping)
    ],
  },

  "tech-stacks": {
    sourceEndpoint: "tech-stacks",
    sourcePopulate: "*",
    targetEndpoint: "tech-stacks",
    dedupField: "name",
    sourceUid: "api::tech-stack.tech-stack",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
    ],
  },

  // ─── Reviews ───

  reviews: {
    sourceEndpoint: "reviews",
    sourcePopulate: {
      author: { populate: "*" },
      logo: { populate: "*" },
      link: { populate: "*" },
    },
    targetEndpoint: "reviews",
    dedupField: "quote",
    sourceUid: "api::review.review",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // TODO: map v4 author (person component) → v5 authorName, authorRole, authorAvatar
      // TODO: map v4 logo → v5 logo media
      // TODO: map v4 link → v5 link component
      uploadMedia,
    ],
  },

  // ─── News ───

  "news-items": {
    sourceEndpoint: "news-items",
    sourcePopulate: {
      link: { populate: "*" },
      thumbnail: { populate: "*" },
    },
    targetEndpoint: "news-items",
    dedupField: "date",
    sourceUid: "api::news-item.news-item",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // TODO: map v4 link → v5 link component
      // TODO: map v4 thumbnail → v5 thumbnail component
      uploadMedia,
    ],
  },

  // ─── CMS pages ───

  "cms-pages": {
    sourceEndpoint: "cms",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      logo: { populate: "*" },
      field: { populate: "*" },
    },
    targetEndpoint: "cmses",
    dedupField: "slug",
    sourceUid: "api::cm.cm",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // TODO: map v4 field → v5 fields (cms.field-entry)
      // TODO: map v4 logo → v5 logo media
      // TODO: remap slices → sections dynamic zone
      remapDynamicZone("slices", "sections"),
      uploadMedia,
    ],
  },

  "cms-comparisons": {
    sourceEndpoint: "comparators",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      cms: { populate: { logo: { populate: "*" }, field: { populate: "*" } } },
      SEO: { populate: "*" },
    },
    targetEndpoint: "cms-comparisons",
    dedupField: "slug",
    sourceUid: "api::comparator.comparator",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        // v4-only relation fields — need id mapping
        "cms"
      ),
      // TODO: map v4 SEO → v5 seo, map v4 upperContent → v5 content
      // TODO: remap slices → content dynamic zone
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  // ─── Post categories & tags (v5 references from blog-post) ───

  "post-categories": {
    sourceEndpoint: "post-categories",
    sourcePopulate: {
      seo: { populate: "*" },
      post_sub_categories: { populate: "*" },
    },
    targetEndpoint: "post-categories",
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
        "post_sub_categories"
      ),
      // TODO: map v4 sub-categories → v5 parent/children hierarchy
      transformSeo,
    ],
  },

  "post-tags": {
    sourceEndpoint: "post-tags",
    sourcePopulate: {
      seo: { populate: "*" },
    },
    targetEndpoint: "post-tags",
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
        "blogPosts"
      ),
      transformSeo,
    ],
  },

  // ─── HubSpot forms (no v4 equivalent — manual/seed only) ───

  "hubspot-forms": {
    sourceEndpoint: "hubspot-forms",
    sourcePopulate: "*",
    targetEndpoint: "hubspot-forms",
    dedupField: "name",
    sourceUid: "api::hubspot-form.hubspot-form",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
    ],
  },
}
