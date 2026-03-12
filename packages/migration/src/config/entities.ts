import type { TransformFn } from "../transforms/base.ts"
import {
  convertLinkFields,
  convertMediaImageFields,
  convertV4FieldEntries,
  convertV4Link,
  ensureSlug,
  extractMediaUrl,
  extractNestedRelationId,
  extractRelationIds,
  extractV4Person,
  slugify,
  uploadDirectMediaFields,
} from "../transforms/convert.ts"
import { remapDynamicZone } from "../transforms/dynamic-zone.ts"
import { dropFields, renameFields } from "../transforms/fields.ts"
import { flattenV4 } from "../transforms/flatten-v4.ts"
import { uploadMedia } from "../transforms/media.ts"
import { resolveRelations } from "../transforms/relations.ts"
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

// ─── Entity configs ordered by dependency ───
// Atomic entities first, then entities that depend on them.

export const ENTITY_CONFIGS: Record<string, EntityMigrationConfig> = {
  // ═════════════════════════════════════════
  // TAXONOMY / LOOKUP TABLES (no dependencies)
  // ═════════════════════════════════════════

  countries: {
    sourceEndpoint: "countries",
    sourcePopulate: {
      flag: { populate: "*" },
    },
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
      ensureSlug("name"),
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
        "users"
      ),
      ensureSlug("name"),
      // Resolve country relation via IdMap (flattenV4 unwraps to { _v4Id, name })
      resolveRelations({ country: "api::country.country" }),
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
      ensureSlug("name"),
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
      ensureSlug("name"),
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
      ensureSlug("name"),
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
      ensureSlug("name"),
    ],
  },

  // ═════════════════════════════════════════
  // BLOG TAXONOMY (no dependencies)
  // ═════════════════════════════════════════

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
      ensureSlug("name"),
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
      ensureSlug("name"),
    ],
  },

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
        "post_sub_categories",
        "image"
      ),
      ensureSlug("name"),
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
      ensureSlug("name"),
      transformSeo,
    ],
  },

  // ═════════════════════════════════════════
  // SIMPLE ENTITIES (no relation dependencies)
  // ═════════════════════════════════════════

  reviews: {
    sourceEndpoint: "reviews",
    sourcePopulate: {
      author: {
        populate: {
          image: { populate: "*" },
          companyLogo: { populate: "*" },
        },
      },
      logo: { populate: "*" },
      link: { populate: "*" },
    },
    targetEndpoint: "reviews",
    dedupField: "quote",
    sourceUid: "api::review.review",
    transforms: [
      flattenV4,
      dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
      // Extract person component → flat fields + upload avatar/logo
      ((entity, ctx) => {
        const result = { ...entity }
        const person = extractV4Person(result["author"])

        result["authorName"] = person.authorName
        result["authorRole"] = person.authorRole
        delete result["author"]

        // Handle authorAvatar: upload from person.image URL
        if (person.avatarUrl) {
          result["_avatarUrl"] = person.avatarUrl
        }

        // Handle company logo from person → stored in review.logo
        // v4 review also has its own logo field (media.image component)
        // Prefer the review's own logo, fallback to person's companyLogo
        const reviewLogoComp = result["logo"] as
          | Record<string, unknown>
          | undefined
        const reviewLogoMedia = reviewLogoComp
          ? extractMediaUrl(reviewLogoComp["media"] ?? reviewLogoComp)
          : undefined

        if (reviewLogoMedia) {
          result["_logoUrl"] = reviewLogoMedia.url.startsWith("http")
            ? reviewLogoMedia.url
            : `https://delicate-dawn-ac25646e6d.media.strapiapp.com${reviewLogoMedia.url}`
        } else if (person.logoUrl) {
          result["_logoUrl"] = person.logoUrl
        }

        delete result["logo"]

        // Convert link component
        result["link"] = convertV4Link(result["link"])

        return result
      }) as TransformFn,
      // Upload avatar and logo as direct media fields
      (async (entity, ctx) => {
        const result = { ...entity }

        // Upload authorAvatar
        const avatarUrl = result["_avatarUrl"] as string | undefined
        delete result["_avatarUrl"]

        if (avatarUrl) {
          if (ctx.dryRun) {
            result["authorAvatar"] = null
          } else {
            const cachedId = ctx.mediaCache.get(avatarUrl)

            if (cachedId) {
              result["authorAvatar"] = cachedId
            } else {
              const mediaId = await ctx.targetClient.uploadMedia(avatarUrl)

              if (mediaId) {
                ctx.mediaCache.set(avatarUrl, mediaId)
                result["authorAvatar"] = mediaId
              } else {
                result["authorAvatar"] = null
              }
            }
          }
        }

        // Upload logo
        const logoUrl = result["_logoUrl"] as string | undefined
        delete result["_logoUrl"]

        if (logoUrl) {
          if (ctx.dryRun) {
            result["logo"] = null
          } else {
            const cachedId = ctx.mediaCache.get(logoUrl)

            if (cachedId) {
              result["logo"] = cachedId
            } else {
              const mediaId = await ctx.targetClient.uploadMedia(logoUrl)

              if (mediaId) {
                ctx.mediaCache.set(logoUrl, mediaId)
                result["logo"] = mediaId
              } else {
                result["logo"] = null
              }
            }
          }
        }

        return result
      }) as TransformFn,
    ],
  },

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
      // Convert v4 link → v5 utilities.link
      convertLinkFields("link"),
      // Convert v4 thumbnail (media.image component) → v5 media.image
      convertMediaImageFields("thumbnail"),
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
          entity["type"] = "cloud"
        }

        return entity
      }) as TransformFn,
      uploadMedia,
    ],
  },

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

  // ═════════════════════════════════════════
  // ENTITIES WITH RELATION DEPENDENCIES
  // ═════════════════════════════════════════

  integrations: {
    sourceEndpoint: "integrations",
    sourcePopulate: {
      seo: { populate: "*" },
      logo: { populate: "*" },
      image: { populate: "*" },
      link: { populate: "*" },
      integration_topics: { populate: "*" },
      integration_tags: { populate: "*" },
      slices: DEEP_DZ_POPULATE["slices"],
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
        // No v5 equivalent for topics
        "integration_topics",
        // User relation can't be mapped
        "user"
      ),
      // Convert v4 link → v5 utilities.link
      convertLinkFields("link"),
      // Convert v4 media.image components → v5 format with fallbackSrc
      convertMediaImageFields("logo", "image"),
      // Map v4 integration_tags → v5 integrationCategories via IdMap
      ((entity, ctx) => {
        const result = { ...entity }
        const tagIds = extractRelationIds(result["integration_tags"])
        delete result["integration_tags"]

        if (tagIds.length > 0) {
          const resolved = tagIds
            .map((v4Id) => {
              const v5DocId = ctx.idMap.get(
                "api::integration-tag.integration-tag",
                v4Id
              )

              if (v5DocId) {
                return v5DocId
              }

              ctx.logger.warn(
                `Unresolved integration category: v4Id=${v4Id}`
              )

              return null
            })
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["integrationCategories"] = { set: resolved }
          }
        }

        return result
      }) as TransformFn,
      // Dynamic zone: slices → sections
      remapDynamicZone("slices", "sections"),
      transformSeo,
      uploadMedia,
    ],
  },

  partners: {
    sourceEndpoint: "partners",
    sourcePopulate: {
      seo: { populate: "*" },
      hero: { populate: { image: { populate: "*" } } },
      intro: {
        populate: {
          button: { populate: "*" },
          smallTextWithLink: { populate: "*" },
        },
      },
      logo: { populate: "*" },
      location: {
        populate: {
          cities: { populate: "*" },
          countries: { populate: "*" },
        },
      },
      services: { populate: "*" },
      techStacks: { populate: "*" },
      slices: DEEP_DZ_POPULATE["slices"],
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
        "hero"
      ),
      // Extract fields from v4 intro component → v5 flat fields
      ((entity, ctx) => {
        const result = { ...entity }
        const intro = (result["intro"] ?? {}) as Record<string, unknown>
        delete result["intro"]

        // title from intro.title (required in v5)
        if (!result["title"] || typeof result["title"] !== "string") {
          result["title"] =
            (intro["title"] as string) ?? (result["slug"] as string) ?? "Untitled"
        }

        // label from intro.label
        if (intro["label"]) {
          result["label"] = intro["label"]
        }

        // description from intro.text
        if (intro["text"]) {
          result["description"] = intro["text"]
        }

        // CTA from first button
        const buttons = intro["button"] as
          | Record<string, unknown>[]
          | undefined
        if (buttons && buttons.length > 0) {
          const btn = buttons[0]!
          result["cta"] = {
            type: "external",
            label: (btn["label"] as string) ?? "",
            newTab: false,
            href: (btn["url"] as string) ?? (btn["href"] as string) ?? "",
          }
        }

        return result
      }) as TransformFn,
      // Convert level/type enums to lowercase-hyphen format
      ((entity) => {
        const result = { ...entity }

        if (typeof result["level"] === "string") {
          result["level"] = (result["level"] as string)
            .toLowerCase()
            .replaceAll(" ", "-")
        }

        if (typeof result["type"] === "string") {
          result["type"] = (result["type"] as string)
            .toLowerCase()
            .replaceAll(" ", "-")
        }

        return result
      }) as TransformFn,
      // Extract city/country from location component
      ((entity, ctx) => {
        const result = { ...entity }
        const location = result["location"] as
          | Record<string, unknown>
          | undefined
        delete result["location"]

        if (location) {
          // Extract first city
          const cityV4Id = extractNestedRelationId(location, "cities")
          if (cityV4Id) {
            const cityDocId = ctx.idMap.get("api::city.city", cityV4Id)

            if (cityDocId) {
              result["city"] = { set: [cityDocId] }
            } else {
              ctx.logger.warn(`Unresolved city: v4Id=${cityV4Id}`)
            }
          }

          // Extract first country
          const countryV4Id = extractNestedRelationId(location, "countries")
          if (countryV4Id) {
            const countryDocId = ctx.idMap.get(
              "api::country.country",
              countryV4Id
            )

            if (countryDocId) {
              result["country"] = { set: [countryDocId] }
            } else {
              ctx.logger.warn(`Unresolved country: v4Id=${countryV4Id}`)
            }
          }
        }

        return result
      }) as TransformFn,
      // Resolve services and techStacks relations via IdMap
      ((entity, ctx) => {
        const result = { ...entity }

        // services
        const serviceIds = extractRelationIds(result["services"])
        if (serviceIds.length > 0) {
          const resolved = serviceIds
            .map((v4Id) =>
              ctx.idMap.get("api::partner-service.partner-service", v4Id)
            )
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["services"] = { set: resolved }
          }
        } else {
          delete result["services"]
        }

        // techStacks
        const techIds = extractRelationIds(result["techStacks"])
        if (techIds.length > 0) {
          const resolved = techIds
            .map((v4Id) =>
              ctx.idMap.get("api::tech-stack.tech-stack", v4Id)
            )
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["techStacks"] = { set: resolved }
          }
        } else {
          delete result["techStacks"]
        }

        return result
      }) as TransformFn,
      // Convert logo media.image component → v5 format
      convertMediaImageFields("logo"),
      // Dynamic zone: slices → sections
      remapDynamicZone("slices", "sections"),
      transformSeo,
      uploadMedia,
    ],
  },

  "case-studies": {
    sourceEndpoint: "case-studies",
    sourcePopulate: {
      seo: { populate: "*" },
      coverImage: { populate: "*" },
      whiteHero: {
        populate: {
          logoImage: { populate: "*" },
          topRightImage: { populate: "*" },
          intro: {
            populate: {
              button: { populate: "*" },
            },
          },
        },
      },
      case_study_use_cases: { populate: "*" },
      slices: DEEP_DZ_POPULATE["slices"],
    },
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
      // Extract logoImage from whiteHero component
      ((entity) => {
        const result = { ...entity }
        const whiteHero = result["whiteHero"] as
          | Record<string, unknown>
          | undefined
        delete result["whiteHero"]

        if (whiteHero?.["logoImage"]) {
          result["logoImage"] = whiteHero["logoImage"]
        }

        return result
      }) as TransformFn,
      // Convert media.image components → v5 format
      convertMediaImageFields("coverImage", "logoImage"),
      // Map case_study_use_cases → categories via IdMap
      ((entity, ctx) => {
        const result = { ...entity }
        const useCaseIds = extractRelationIds(result["case_study_use_cases"])
        delete result["case_study_use_cases"]

        if (useCaseIds.length > 0) {
          const resolved = useCaseIds
            .map((v4Id) =>
              ctx.idMap.get(
                "api::case-study-use-case.case-study-use-case",
                v4Id
              )
            )
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["categories"] = { set: resolved }
          }
        }

        return result
      }) as TransformFn,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  "blog-posts": {
    sourceEndpoint: "blog-posts",
    sourcePopulate: {
      image: { populate: "*" },
      tags: { populate: "*" },
      seo: { populate: "*" },
      featuredCategory: { populate: "*" },
      user: { populate: "*" },
      slices: DEEP_DZ_POPULATE["slices"],
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
        "card",
        "version",
        // User relations can't be mapped (users-permissions)
        "user",
        "coauthors",
        "postSubCategory"
      ),
      // Normalize slug
      ((entity) => {
        const result = { ...entity }

        if (!result["title"]) {
          result["title"] = "Untitled"
        }

        if (!result["slug"]) {
          result["slug"] = `post-${Date.now()}`
        }

        if (typeof result["slug"] === "string") {
          result["slug"] = (result["slug"] as string)
            .toLowerCase()
            .replaceAll(".", "-")
            .replaceAll(/[^a-z0-9-]/g, "")
            .replaceAll(/-+/g, "-")
            .replaceAll(/^-|-$/g, "")
        }

        return result
      }) as TransformFn,
      // Convert image (media.image component) → v5 format
      convertMediaImageFields("image"),
      // Map featuredCategory → category via IdMap
      ((entity, ctx) => {
        const result = { ...entity }
        const cat = result["featuredCategory"] as
          | Record<string, unknown>
          | undefined
        delete result["featuredCategory"]

        if (cat && typeof cat["_v4Id"] === "number") {
          const docId = ctx.idMap.get(
            "api::post-category.post-category",
            cat["_v4Id"] as number
          )

          if (docId) {
            result["category"] = { set: [docId] }
          } else {
            ctx.logger.warn(
              `Unresolved blog category: v4Id=${cat["_v4Id"]}`
            )
          }
        }

        return result
      }) as TransformFn,
      // Map tags → tags via IdMap
      ((entity, ctx) => {
        const result = { ...entity }
        const tagIds = extractRelationIds(result["tags"])

        if (tagIds.length > 0) {
          const resolved = tagIds
            .map((v4Id) =>
              ctx.idMap.get("api::post-tag.post-tag", v4Id)
            )
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["tags"] = { set: resolved }
          }
        } else {
          delete result["tags"]
        }

        return result
      }) as TransformFn,
      // Dynamic zone: slices → sections
      remapDynamicZone("slices", "sections"),
      transformSeo,
      uploadMedia,
    ],
  },

  // ═════════════════════════════════════════
  // CMS ENTITIES
  // ═════════════════════════════════════════

  "cms-pages": {
    sourceEndpoint: "cms",
    sourcePopulate: {
      logo: { populate: "*" },
      field: { populate: "*" },
      slices: DEEP_DZ_POPULATE["slices"],
    },
    targetEndpoint: "cmses",
    dedupField: "slug",
    sourceUid: "api::cm.cm",
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
      ensureSlug("name"),
      // Convert v4 field (text.text-and-boolean[]) → v5 fields (cms.field-entry[])
      ((entity) => {
        const result = { ...entity }
        result["fields"] = convertV4FieldEntries(result["field"])
        delete result["field"]

        return result
      }) as TransformFn,
      // Upload logo as direct media field (v4 and v5 both use direct media)
      uploadDirectMediaFields("logo"),
      remapDynamicZone("slices", "sections"),
      uploadMedia,
    ],
  },

  "cms-comparisons": {
    sourceEndpoint: "comparators",
    sourcePopulate: {
      SEO: { populate: "*" },
      cms: { populate: { logo: { populate: "*" }, field: { populate: "*" } } },
      slices: DEEP_DZ_POPULATE["slices"],
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
        // CMS relation has no direct v5 equivalent
        "cms"
      ),
      // Rename uppercase SEO → lowercase seo
      renameFields({ SEO: "seo" }),
      // Ensure required title
      ensureTitle,
      // Merge upperContent into description if description is empty
      ((entity) => {
        const result = { ...entity }

        if (result["upperContent"] && !result["description"]) {
          result["description"] = result["upperContent"]
        }

        delete result["upperContent"]

        return result
      }) as TransformFn,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  // ═════════════════════════════════════════
  // PAGES (dynamic zones skipped for now)
  // ═════════════════════════════════════════

  pages: {
    sourceEndpoint: "universals",
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::universal.universal",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "darkMode"
      ),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },
}
