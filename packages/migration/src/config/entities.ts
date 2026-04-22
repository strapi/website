import type { V4Entity } from "../clients/source.ts"
import { normalizePageSlug, resolvePageParent } from "../entities/page.ts"
import type { LoadResult } from "../pipeline/load.ts"
import type { TransformContext, TransformFn } from "../transforms/base.ts"
import {
  absoluteUrl,
  convertLinkFields,
  convertMediaImageFields,
  convertV4FieldEntries,
  convertV4Link,
  ensureSlug,
  extractMediaUrl,
  extractRelationIds,
  extractV4Person,
  uploadDirectMediaFields,
  convertV4BasicImage,
  convertV4LinkText,
  convertV4LinkImage,
  normalizeV5Slug,
} from "../transforms/convert.ts"
import { remapDynamicZone } from "../transforms/dynamic-zone.ts"
import { dropFields, renameFields } from "../transforms/fields.ts"
import { flattenV4 } from "../transforms/flatten-v4.ts"
import { uploadMedia } from "../transforms/media.ts"
import { resolveRelations } from "../transforms/relations.ts"
import { transformBlogSeo, transformSeo } from "../transforms/seo.ts"

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
          button: { populate: "*" },
          card: { populate: "*" },
        },
      },
      features: {
        populate: { image: { populate: "*" }, icon: { populate: "*" } },
      },
      brands: {
        populate: { image: { populate: "*" }, logo: { populate: "*" } },
      },
      thumbnails: { populate: { image: { populate: "*" } } },

      // Intro component field (slices.intro uses "content" as component field)
      content: { populate: { button: { populate: "*" } } },

      // v4 section-with-image has button (links.button → links.link) at slice level
      button: { populate: { link: { populate: "*" } } },

      // Stats / icons / images / groups (various career/page slices)
      stats: { populate: "*" },
      icons: { populate: { icon: { populate: "*" } } },
      images: { populate: "*" },
      groups: { populate: { perks: { populate: "*" } } },

      // Case study card relation (singular) — case study has coverImage + whiteHero
      card: {
        populate: {
          image: { populate: "*" },
          backgroundImage: { populate: "*" },
          coverImage: { populate: { media: { populate: "*" } } },
          whiteHero: { populate: { intro: { populate: "*" } } },
        },
      },

      // Embed form sub-component
      embedForm: { populate: "*" },

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
    // Strapi v4 needs the `.on` syntax for certain DZ component fields to be
    // populated — the flat `populate: {...}` above doesn't reliably hydrate
    // every nested component (e.g. `newsletter`, `blogPosts` relation).
    on: {
      "slices.newsletter-banner": {
        populate: { newsletter: { populate: "*" } },
      },
      "slices.related-blog-posts": {
        populate: {
          intro: { populate: "*" },
          gradientHeader: { populate: "*" },
          blogPosts: { fields: ["id"] },
        },
      },
      "slices.related-posts": {
        populate: {
          blogPosts: { fields: ["id"] },
          category: { fields: ["id"] },
        },
      },
      "slices.embed-form": {
        populate: {
          intro: { populate: "*" },
          gradientHeader: { populate: "*" },
          embedForm: { populate: "*" },
        },
      },
    },
  },
}

// ─── Helpers for entity-level hero → DZ entry ───

const asRecord = (v: unknown): Record<string, unknown> =>
  v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}

const asArray = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : []

/** Convert a v4 button (multiple formats) to v5 utilities.link shape */
function v4ButtonToLink(btn: Record<string, unknown>): Record<string, unknown> {
  // v4 buttons come in two formats:
  // 1. { label, url } — standard
  // 2. { theme, link: { href, text } } — used in intro/hero/content components
  const link = btn["link"] as Record<string, unknown> | undefined

  return {
    type: "external",
    label: (btn["label"] as string) ?? (link?.["text"] as string) ?? "",
    newTab: (btn["newTab"] as boolean) ?? false,
    href:
      (btn["url"] as string) ??
      (btn["href"] as string) ??
      (link?.["href"] as string) ??
      "",
    decorations: { variant: "default", size: "default", hasIcons: false },
  }
}

/** Wrap a v4 media object into v5 utilities.basic-image shape */
function wrapV4Media(media: unknown): Record<string, unknown> | undefined {
  if (!media || typeof media !== "object") return undefined
  const m = media as Record<string, unknown>

  // v4 nested: { data: { id, attributes: { url, ... } } }
  if (m["data"] && typeof m["data"] === "object") {
    const data = m["data"] as Record<string, unknown>
    const attrs = (data["attributes"] as Record<string, unknown>) ?? data
    const url = attrs["url"] as string | undefined

    if (url) {
      return {
        alt: (attrs["alternativeText"] as string) ?? "",
        width: attrs["width"] ?? null,
        height: attrs["height"] ?? null,
        fallbackSrc: url.startsWith("http")
          ? url
          : `https://delicate-dawn-ac25646e6d.media.strapiapp.com${url}`,
      }
    }
  }

  // Component wrapper: { media: { data: { ... } } } or { image: { data: { ... } } }
  for (const key of ["media", "image", "logo", "icon"]) {
    const nested = m[key]
    if (nested && typeof nested === "object") {
      const result = wrapV4Media(nested)
      if (result) return result
    }
  }

  // Direct with url
  if (typeof m["url"] === "string") {
    return {
      alt: (m["alternativeText"] as string) ?? "",
      width: m["width"] ?? null,
      height: m["height"] ?? null,
      fallbackSrc: (m["url"] as string).startsWith("http")
        ? (m["url"] as string)
        : `https://delicate-dawn-ac25646e6d.media.strapiapp.com${m["url"]}`,
    }
  }

  return undefined
}

/**
 * Convert a v4 text.label-title-text-links component to a v5 sections.hero DZ entry.
 * Extracts: label, title, text→description, button[]→ctas[]
 */
function introToHeroDzEntry(
  introData: Record<string, unknown>
): Record<string, unknown> {
  const buttons = Array.isArray(introData["button"])
    ? (introData["button"] as Record<string, unknown>[])
    : []

  return {
    __component: "sections.hero",
    label: (introData["label"] as string) ?? "",
    title: (introData["title"] as string) ?? "",
    description: (introData["text"] as string) ?? "",
    ctas: buttons.map(v4ButtonToLink),
  }
}

/**
 * Convert a v4 text.label-title-text-links to a v5 sections.section-header DZ entry.
 */
function introToSectionHeaderDzEntry(
  introData: Record<string, unknown>
): Record<string, unknown> {
  const buttons = Array.isArray(introData["button"])
    ? (introData["button"] as Record<string, unknown>[])
    : []

  return {
    __component: "sections.section-header",
    section: {
      label: (introData["label"] as string) ?? "",
      title: (introData["title"] as string) ?? "",
      description: (introData["text"] as string) ?? "",
      ctaLinks: buttons.map(v4ButtonToLink),
    },
  }
}

/** Prepend DZ entries to the content array */
function prependToContent(
  entity: Record<string, unknown>,
  ...entries: Record<string, unknown>[]
): Record<string, unknown> {
  const content = Array.isArray(entity["content"])
    ? (entity["content"] as unknown[])
    : []

  return { ...entity, content: [...entries, ...content] }
}

/** Set a hardcoded slug and fullPath for single-type entities */
function setSlug(slug: string, fullPath?: string): TransformFn {
  return (entity) => ({
    ...entity,
    slug,
    fullPath: fullPath ?? `/${slug}`,
  })
}

/** Populate config for hero components that nest text.label-title-text-links */
const INTRO_POPULATE = {
  populate: {
    button: { populate: "*" },
    smallTextWithLink: { populate: "*" },
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

/**
 * Resolve hubspot-form references in the content/sections dynamic zone.
 * Finds DZ entries with _hubspotFormId (on forms.hubspot-form and
 * forms.newsletter), creates/finds the hubspot-form entity, and links it
 * via the component's relation field.
 */
const HUBSPOT_FORM_RELATIONS: Record<string, string> = {
  "forms.hubspot-form": "form",
  "forms.newsletter": "hubspotForm",
}

// eslint-disable-next-line sonarjs/no-invariant-returns
const resolveHubspotForms: TransformFn = async (entity, ctx) => {
  const dzField = Array.isArray(entity["content"])
    ? "content"
    : Array.isArray(entity["sections"])
      ? "sections"
      : undefined

  if (!dzField) return entity

  const content = entity[dzField] as Record<string, unknown>[]

  for (const entry of content) {
    const component = entry["__component"] as string
    const relationField = HUBSPOT_FORM_RELATIONS[component]
    if (!relationField) continue

    const formId = entry["_hubspotFormId"] as string | undefined
    const portalId = entry["_hubspotPortalId"] as string | undefined
    delete entry["_hubspotFormId"]
    delete entry["_hubspotPortalId"]

    if (!formId) continue

    try {
      const existing = await ctx.targetClient.findByField(
        "hubspot-forms",
        "formId",
        formId
      )

      if (existing) {
        entry[relationField] = existing.documentId
        ctx.logger.debug(
          `Linked existing hubspot-form: ${formId} → ${component}.${relationField}`
        )
      } else if (!ctx.dryRun) {
        const created = await ctx.targetClient.create("hubspot-forms", {
          name: `HubSpot Form ${formId.slice(0, 8)}`,
          portalId: portalId ?? "",
          formId,
        })

        entry[relationField] = created.documentId
        ctx.logger.debug(
          `Created hubspot-form: ${formId} → ${created.documentId} (${component}.${relationField})`
        )
      }
    } catch (e) {
      ctx.logger.warn(
        `Failed to resolve hubspot-form ${formId}: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }

  return entity
}

/**
 * Enrich case-study-card DZ entries by fetching the full case study
 * from v4 to get title, company name, and cover image.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/no-invariant-returns
const enrichCaseStudyCards: TransformFn = async (entity, ctx) => {
  const content = entity["content"] as Record<string, unknown>[] | undefined
  if (!content || !Array.isArray(content)) return entity

  for (const entry of content) {
    if (entry["__component"] !== "cards.case-study-card") continue

    const ctaLink = asRecord(entry["ctaLink"])
    const href = (ctaLink["href"] as string) ?? ""
    const slugMatch = href.match(/\/case-studies\/(.+)$/)
    if (!slugMatch) continue

    const slug = slugMatch[1]

    try {
      // Find the case study by slug in v4
      const res = await fetch(
        `${ctx.env.source.baseUrl}/api/case-studies?filters[slug][$eq]=${slug}&populate[whiteHero][populate][intro][populate]=*&populate[coverImage][populate][media][populate]=*&publicationState=preview&locale=en`,
        { headers: { Authorization: `Bearer ${ctx.env.source.token}` } }
      )

      const json = (await res.json()) as {
        data: { attributes: Record<string, unknown> }[]
      }

      const cs = json.data[0]?.attributes
      if (!cs) continue

      // Extract title and company from whiteHero.intro
      const hero = asRecord(asRecord(cs["whiteHero"])["intro"])
      if (hero["title"]) entry["title"] = hero["title"]
      if (hero["label"]) entry["companyName"] = hero["label"]

      // Extract cover image
      const coverMedia = asRecord(
        asRecord(asRecord(asRecord(cs["coverImage"])["media"])["data"])[
          "attributes"
        ]
      )

      if (coverMedia["url"]) {
        const url = coverMedia["url"] as string
        entry["image"] = {
          alt: (coverMedia["alternativeText"] as string) ?? "",
          width: coverMedia["width"] ?? null,
          height: coverMedia["height"] ?? null,
          fallbackSrc: url.startsWith("http")
            ? url
            : `https://delicate-dawn-ac25646e6d.media.strapiapp.com${url}`,
        }
      }

      ctx.logger.debug(`Enriched case-study-card: ${slug}`)
    } catch (e) {
      ctx.logger.warn(
        `Failed to enrich case-study ${slug}: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }

  return entity
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
  /** Whether this is a v4 single type (fetched without pagination/ID) */
  singleType?: boolean
  /** Whether the v5 target is a single type (PUT without documentId) */
  targetSingleType?: boolean
  /**
   * Names of upstream ENTITY_CONFIGS keys whose IdMap must be populated before
   * this entity's transforms run. Prewarmed from live v4 + v5 APIs at run start.
   */
  dependencies?: readonly string[]
  /** Custom extract function (overrides default fetchAll) */
  customExtract?: (ctx: TransformContext) => Promise<V4Entity[]>
  /** Custom fetchOne function (overrides default fetchOne per entity) */
  customFetchOne?: (id: number, ctx: TransformContext) => Promise<V4Entity>
  /** Custom load function (overrides default create/update via content API) */
  customLoad?: (
    entity: Record<string, unknown>,
    ctx: TransformContext
  ) => Promise<LoadResult>
}

// ─── Helpers ───

let _authenticatedRoleId: number | undefined

async function fetchAuthenticatedRoleId(
  ctx: TransformContext
): Promise<number> {
  const url = `${ctx.env.target.baseUrl}/api/users-permissions/roles`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ctx.env.target.token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch roles: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as {
    roles: { id: number; name: string; type: string }[]
  }

  const role = data.roles.find((r) => r.type === "authenticated")

  if (!role) {
    throw new Error(
      "Authenticated role not found in v5. Available: " +
        data.roles.map((r) => r.type).join(", ")
    )
  }

  ctx.logger.debug(`Resolved Authenticated role: id=${role.id}`)

  return role.id
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
    dependencies: ["countries"],
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

  // ═════════════════════════════════════════
  // USERS (depends on cities)
  // ═════════════════════════════════════════

  users: {
    dependencies: ["cities"],
    sourceEndpoint: "users",
    sourcePopulate: "*",
    targetEndpoint: "users",
    dedupField: "email",
    sourceUid: "plugin::users-permissions.user",

    customExtract: async (ctx) => {
      ctx.logger.info("Extracting IDs from: users")
      let users = await ctx.sourceClient.fetchUsers()

      if (ctx.limit) {
        users = users.slice(0, ctx.limit)
      }

      ctx.logger.info(`Found ${users.length} entities to process`)

      return users
    },

    customFetchOne: async (id, ctx) =>
      ctx.sourceClient.fetchUser(id, "avatar.media,profilePicture.media,city"),

    customLoad: async (entity, ctx) => {
      // Look up Authenticated role ID (cached after first call)
      if (!_authenticatedRoleId) {
        _authenticatedRoleId = await fetchAuthenticatedRoleId(ctx)
      }

      entity["role"] = _authenticatedRoleId

      const existing = await ctx.targetClient.findUserByField(
        "email",
        entity["email"]
      )

      if (existing && !ctx.force) {
        return { action: "skipped", documentId: existing.documentId }
      }

      if (existing) {
        const updated = await ctx.targetClient.updateUser(existing.id, entity)

        return { action: "updated", documentId: updated.documentId }
      }

      const created = await ctx.targetClient.createUser(entity)

      return { action: "created", documentId: created.documentId }
    },

    transforms: [
      // No flattenV4 — users-permissions returns flat objects
      dropFields(
        "id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "provider",
        "confirmed",
        "blocked",
        "role",
        "password",
        "resetPasswordToken",
        "confirmationToken",
        "_v4Id",
        // v4 relation fields we handle separately
        "blog_posts",
        "blogPosts",
        // v4-only fields not in v5
        "showEmail",
        "job_category",
        "second_job_category",
        "profileLinks",
        "resource",
        "strapi_stage",
        "strapi_assignee"
      ),
      ensureSlug("username"),

      // Convert v4 avatar/profilePicture components → v5 media.image component
      // v4 shape: { id, href, media: { url, alternativeText, width, height, ... } }
      // v5 shape: media.image → { image: { alt, width, height, fallbackSrc } }
      //   then uploadMedia replaces fallbackSrc with media: <v5_id>
      ((entity) => {
        const result = { ...entity }

        for (const field of ["avatar", "profilePicture"] as const) {
          const component = result[field] as Record<string, unknown> | undefined

          if (component && typeof component === "object") {
            const mediaInfo = extractMediaUrl(component["media"])

            if (mediaInfo) {
              result[field] = {
                image: {
                  alt: mediaInfo.alt ?? "",
                  width: mediaInfo.width ?? null,
                  height: mediaInfo.height ?? null,
                  fallbackSrc: absoluteUrl(mediaInfo.url),
                },
              }
              continue
            }
          }

          result[field] = null
        }

        return result
      }) as TransformFn,

      // Convert flat social fields → repeatable socials component
      ((entity) => {
        const result = { ...entity }
        const socials: { platform: string; url: string }[] = []

        const socialFields: Record<string, string> = {
          twitter: "twitter",
          github: "github",
          linkedin: "linkedin",
          website: "website",
        }

        for (const [v4Field, platform] of Object.entries(socialFields)) {
          const value = result[v4Field] as string | undefined

          if (value && typeof value === "string" && value.trim()) {
            socials.push({ platform, url: value.trim() })
          }

          delete result[v4Field]
        }

        result["socials"] = socials.length > 0 ? socials : null

        return result
      }) as TransformFn,

      // Map v4 joined (datetime) → v5 joinedDate (date)
      ((entity) => {
        const result = { ...entity }
        const joined = result["joined"] as string | undefined
        delete result["joined"]

        if (joined) {
          result["joinedDate"] = joined.split("T")[0]
        }

        return result
      }) as TransformFn,

      // Resolve city: users-permissions API expects numeric ID, not { set: [documentId] }
      (async (entity, ctx) => {
        const result = { ...entity }
        const city = result["city"] as Record<string, unknown> | undefined

        if (city && typeof city === "object" && city["id"]) {
          const v4Id = city["id"] as number
          const v5DocId = ctx.idMap.get("api::city.city", v4Id)

          if (v5DocId) {
            const v5City = await ctx.targetClient.findByField(
              "cities",
              "documentId",
              v5DocId
            )

            if (v5City) {
              result["city"] = v5City.id
            } else {
              ctx.logger.warn(`City not found in v5: documentId=${v5DocId}`)
              result["city"] = null
            }
          } else {
            ctx.logger.warn(`Unresolved city: v4Id=${v4Id}`)
            result["city"] = null
          }
        } else {
          result["city"] = null
        }

        return result
      }) as TransformFn,

      // Set required v5 defaults
      ((entity) => {
        const result = {
          ...entity,
          ["confirmed"]: true,
          ["blocked"]: false,
          ["provider"]: "local",
          ["password"]: crypto.randomUUID() + "Aa1!",
        }

        return result
      }) as TransformFn,

      uploadMedia,
    ],
  },

  // ═════════════════════════════════════════
  // TAXONOMY (continued)
  // ═════════════════════════════════════════

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

  // Sub-categories are migrated as child `post-category` records using the
  // self-referencing parent/children relation on post-category. This preserves
  // the old taxonomy hierarchy without introducing a separate content type.
  "post-sub-categories": {
    dependencies: ["post-categories"],
    sourceEndpoint: "post-sub-categories",
    sourcePopulate: {
      post_category: { populate: "*" },
      seo: { populate: "*" },
    },
    targetEndpoint: "post-categories",
    dedupField: "slug",
    sourceUid: "api::post-sub-category.post-sub-category",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "blogPosts",
        "blog_posts",
        "seo"
      ),
      ensureSlug("name"),
      ((entity, ctx) => {
        const result = { ...entity }
        const parent = result["post_category"] as { _v4Id?: number } | undefined
        delete result["post_category"]

        if (parent?.["_v4Id"]) {
          const parentDoc = ctx.idMap.get(
            "api::post-category.post-category",
            parent["_v4Id"]
          )

          if (parentDoc) {
            result["parent"] = { set: [parentDoc] }
          } else {
            ctx.logger.warn(
              `Unresolved parent category for sub-category: v4Id=${parent["_v4Id"]}`
            )
          }
        }

        return result
      }) as TransformFn,
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
            const cachedAvatar = ctx.mediaCache.get(avatarUrl)

            if (cachedAvatar) {
              result["authorAvatar"] = cachedAvatar.id
            } else {
              const uploaded = await ctx.targetClient.uploadMedia(avatarUrl)

              if (uploaded) {
                ctx.mediaCache.set(avatarUrl, uploaded)
                result["authorAvatar"] = uploaded.id
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
            const cachedLogo = ctx.mediaCache.get(logoUrl)

            if (cachedLogo) {
              result["logo"] = cachedLogo.id
            } else {
              const uploaded = await ctx.targetClient.uploadMedia(logoUrl)

              if (uploaded) {
                ctx.mediaCache.set(logoUrl, uploaded)
                result["logo"] = uploaded.id
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

  // hubspot-forms: v4 doesn't expose this as a collection type (404).
  // HubSpot forms are created on-the-fly by resolveHubspotForms when
  // encountered inside page dynamic zones.

  // ═════════════════════════════════════════
  // ENTITIES WITH RELATION DEPENDENCIES
  // ═════════════════════════════════════════

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
        "locale",
        "settings",
        "sectionLabel"
      ),
      // Preserve the original publishedAt as originalPublishedAt for sorting;
      // Strapi will assign a fresh publishedAt when entries are published.
      renameFields({ publishedAt: "originalPublishedAt" }),
      // Extract data from whiteHero: logoImage → top-level, intro.{title,text,label}
      // → top-level title/description/companyName. Hero is rendered by the
      // Next.js view from these first-class fields (no sections.hero prepend).
      // topRightImage is dropped.
      ((entity) => {
        const result = { ...entity }
        const whiteHero = result["whiteHero"] as
          | Record<string, unknown>
          | undefined
        delete result["whiteHero"]

        if (whiteHero?.["logoImage"]) {
          result["logoImage"] = whiteHero["logoImage"]
        }

        const intro = whiteHero?.["intro"] as
          | Record<string, unknown>
          | undefined

        if (intro) {
          if (intro["title"] && !result["title"]) {
            result["title"] = intro["title"]
          }

          if (intro["text"] && !result["description"]) {
            result["description"] = intro["text"]
          }

          if (intro["label"] && !result["companyName"]) {
            result["companyName"] = intro["label"]
          }
        }

        // Schema marks `title` required. Fall back through the next-best
        // human-readable fields so v4 rows missing whiteHero.intro.title
        // still pass validation. Surface the source slug to help editors
        // patch the row after import.
        if (!result["title"]) {
          const fallback =
            (typeof whiteHero?.["title"] === "string" && whiteHero["title"]) ||
            (typeof result["companyName"] === "string" &&
              result["companyName"]) ||
            (typeof result["slug"] === "string" && result["slug"]) ||
            "Untitled case study"
          result["title"] = fallback
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
    dependencies: [
      "users",
      "post-categories",
      "post-sub-categories",
      "post-tags",
    ],
    sourceEndpoint: "blog-posts",
    sourcePopulate: {
      image: { populate: "*" },
      tags: { populate: "*" },
      seo: {
        populate: {
          metaImage: { populate: "*" },
          metaSocial: { populate: { image: { populate: "*" } } },
        },
      },
      featuredCategory: { populate: "*" },
      postSubCategory: { populate: "*" },
      user: { populate: "*" },
      coauthors: { populate: "*" },
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
        "locale",
        "settings",
        // v4-only fields without a v5 equivalent
        "card"
      ),
      // Resolve v4 user → v5 author, coauthors
      ((entity, ctx) => {
        const result = { ...entity }

        const user = result["user"] as Record<string, unknown> | undefined
        delete result["user"]

        if (user?.["_v4Id"]) {
          const docId = ctx.idMap.get(
            "plugin::users-permissions.user",
            user["_v4Id"] as number
          )

          if (docId) {
            result["author"] = { set: [docId] }
          } else {
            ctx.logger.warn(`Unresolved blog author: v4Id=${user["_v4Id"]}`)
          }
        }

        const coauthors = result["coauthors"] as
          | Record<string, unknown>[]
          | undefined
        delete result["coauthors"]

        if (coauthors?.length) {
          const resolved = coauthors
            .map((c) =>
              ctx.idMap.get(
                "plugin::users-permissions.user",
                c["_v4Id"] as number
              )
            )
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["coauthors"] = { set: resolved }
          }
        }

        return result
      }) as TransformFn,
      // Normalize slug
      ((entity) => {
        const result = { ...entity }

        if (!result["title"] || !result["slug"]) {
          throw new Error(
            `Skipping orphan blog post (no title/slug): v4Id=${result["_v4Id"]}`
          )
        }

        if (typeof result["slug"] === "string") {
          result["slug"] = normalizeV5Slug(result["slug"] as string)
        }

        return result
      }) as TransformFn,
      // Convert image (media.image component) → v5 format
      convertMediaImageFields("image"),
      // Resolve category: prefer postSubCategory (more specific, migrated as
      // a child post-category) over featuredCategory.
      ((entity, ctx) => {
        const result = { ...entity }
        const sub = result["postSubCategory"] as
          | Record<string, unknown>
          | undefined
        const feat = result["featuredCategory"] as
          | Record<string, unknown>
          | undefined
        delete result["postSubCategory"]
        delete result["featuredCategory"]

        const subId =
          typeof sub?.["_v4Id"] === "number"
            ? (sub["_v4Id"] as number)
            : undefined
        const featId =
          typeof feat?.["_v4Id"] === "number"
            ? (feat["_v4Id"] as number)
            : undefined

        const subDoc = subId
          ? ctx.idMap.get("api::post-sub-category.post-sub-category", subId)
          : undefined
        const featDoc = featId
          ? ctx.idMap.get("api::post-category.post-category", featId)
          : undefined

        const chosen = subDoc ?? featDoc

        if (chosen) {
          result["category"] = { set: [chosen] }
        } else if (subId || featId) {
          ctx.logger.warn(
            `Unresolved blog category: v4Ids sub=${subId ?? "-"} feat=${featId ?? "-"}`
          )
        }

        return result
      }) as TransformFn,
      // Map tags → tags via IdMap
      ((entity, ctx) => {
        const result = { ...entity }
        const tagIds = extractRelationIds(result["tags"])

        if (tagIds.length > 0) {
          const resolved = tagIds
            .map((v4Id) => ctx.idMap.get("api::post-tag.post-tag", v4Id))
            .filter(Boolean) as string[]

          if (resolved.length > 0) {
            result["tags"] = { set: resolved }
          }
        } else {
          delete result["tags"]
        }

        return result
      }) as TransformFn,
      // Preserve v4 publish date in a user-defined field. Strapi v5's system
      // `publishedAt` is server-managed on publish and ignores client values,
      // so historical dates land here instead. Frontend reads
      // `originalPublishedAt ?? publishedAt`.
      ((entity) => {
        const result = { ...entity }

        if (typeof result["publishedAt"] === "string") {
          result["originalPublishedAt"] = result["publishedAt"]
        }

        return result
      }) as TransformFn,
      // Dynamic zone: slices → sections
      remapDynamicZone("slices", "sections"),
      resolveHubspotForms,
      transformBlogSeo,
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
    dedupField: "fullPath",
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
      normalizePageSlug(),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      resolveHubspotForms,
      transformSeo,
      uploadMedia,
      resolvePageParent(),
    ],
  },

  // ═════════════════════════════════════════
  // V4 SINGLE-TYPE PAGES → V5 PAGES
  // ═════════════════════════════════════════

  "page-career": {
    sourceEndpoint: "career",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      careersHero: {
        populate: {
          intro: {
            populate: {
              content: INTRO_POPULATE,
            },
          },
        },
      },
      careersPositions: { populate: "*" },
      alertForm: { populate: "*" },
      aboveReviews: { populate: "*" },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::career.career",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "careersPositions",
        "alertForm",
        "reviews",
        "aboveReviews"
      ),
      setSlug("careers"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from careersHero → intro.content (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["careersHero"])
        delete result["careersHero"]

        const intro = asRecord(asRecord(hero["intro"])["content"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-community": {
    sourceEndpoint: "community",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      communityHero: {
        populate: {
          whiteHero: {
            populate: {
              intro: INTRO_POPULATE,
            },
          },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::community.community",
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
      setSlug("community"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from communityHero → whiteHero.intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["communityHero"])
        delete result["communityHero"]

        const intro = asRecord(asRecord(hero["whiteHero"])["intro"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-content-architecture": {
    sourceEndpoint: "content-architecture",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      useCaseHero: {
        populate: {
          hero: {
            populate: {
              intro: INTRO_POPULATE,
            },
          },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::content-architecture.content-architecture",
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
      setSlug("content-architecture"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from useCaseHero → hero.intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["useCaseHero"])
        delete result["useCaseHero"]

        const intro = asRecord(asRecord(hero["hero"])["intro"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-enterprise": {
    sourceEndpoint: "entreprise-program",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      useCaseHero: {
        populate: {
          hero: {
            populate: {
              intro: INTRO_POPULATE,
              topRightBackgroundImage: { populate: "*" },
              image: { populate: "*" },
            },
          },
          asideImage: { populate: { media: { populate: "*" } } },
          image: { populate: "*" },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::entreprise-program.entreprise-program",
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
      setSlug("enterprise"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from useCaseHero → hero.intro (label-title-text-links + image)
      ((entity) => {
        const result = { ...entity }
        const useCaseHero = asRecord(result["useCaseHero"])
        delete result["useCaseHero"]

        const heroBlock = asRecord(useCaseHero["hero"])
        const intro = asRecord(heroBlock["intro"])

        if (intro["title"]) {
          const heroEntry = introToHeroDzEntry(intro)

          // Extract hero image — asideImage is the main hero illustration
          const heroImage =
            useCaseHero["asideImage"] ??
            heroBlock["topRightBackgroundImage"] ??
            heroBlock["image"] ??
            useCaseHero["image"]

          const wrappedImage = wrapV4Media(heroImage)
          if (wrappedImage) {
            heroEntry.image = wrappedImage
          }

          return prependToContent(result, heroEntry)
        }

        return result
      }) as TransformFn,
      enrichCaseStudyCards,
      resolveHubspotForms,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-features": {
    sourceEndpoint: "feature",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      featuresHero: {
        populate: {
          intro: INTRO_POPULATE,
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::feature.feature",
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
      setSlug("features"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from featuresHero → intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["featuresHero"])
        delete result["featuresHero"]

        const intro = asRecord(hero["intro"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-headless-cms": {
    sourceEndpoint: "headless-cms",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      intro: INTRO_POPULATE,
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::headless-cms.headless-cms",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "decoration"
      ),
      setSlug("headless-cms"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend section-header from intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const intro = asRecord(result["intro"])
        delete result["intro"]

        if (intro["title"]) {
          return prependToContent(result, introToSectionHeaderDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-home": {
    sourceEndpoint: "homepage",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      homeHero: {
        populate: {
          hero: {
            populate: {
              intro: INTRO_POPULATE,
            },
          },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::homepage.homepage",
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
      setSlug("home"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from homeHero → hero.intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["homeHero"])
        delete result["homeHero"]

        const intro = asRecord(asRecord(hero["hero"])["intro"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-launch-week": {
    sourceEndpoint: "launch-week",
    singleType: true,
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::launch-week.launch-week",
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
      setSlug("launch-week"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  "page-why-strapi": {
    sourceEndpoint: "why-strapi",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      useCaseHero: {
        populate: {
          hero: {
            populate: {
              intro: INTRO_POPULATE,
            },
          },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::why-strapi.why-strapi",
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
      setSlug("why-strapi"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend hero from useCaseHero → hero.intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const hero = asRecord(result["useCaseHero"])
        delete result["useCaseHero"]

        const intro = asRecord(asRecord(hero["hero"])["intro"])

        if (intro["title"]) {
          return prependToContent(result, introToHeroDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-showcase": {
    sourceEndpoint: "showcase",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      intro: INTRO_POPULATE,
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::showcase.showcase",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "decorationPosition"
      ),
      setSlug("showcase"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend section-header from intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const intro = asRecord(result["intro"])
        delete result["intro"]

        if (intro["title"]) {
          return prependToContent(result, introToSectionHeaderDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-starters": {
    sourceEndpoint: "starter",
    singleType: true,
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      intro: INTRO_POPULATE,
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::starter.starter",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "decorationPosition",
        "previewButtonText",
        "authorPrefix"
      ),
      setSlug("starters"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend section-header from intro (label-title-text-links)
      ((entity) => {
        const result = { ...entity }
        const intro = asRecord(result["intro"])
        delete result["intro"]

        if (intro["title"]) {
          return prependToContent(result, introToSectionHeaderDzEntry(intro))
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "page-resource-center": {
    sourceEndpoint: "resource-center",
    singleType: true,
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::resource-center.resource-center",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "navigation"
      ),
      setSlug("resource-center"),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  // ═════════════════════════════════════════
  // V4 COLLECTION-TYPE PAGES → V5 PAGES
  // ═════════════════════════════════════════

  "use-cases": {
    sourceEndpoint: "use-cases",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      useCaseHero: {
        populate: {
          hero: {
            populate: {
              intro: INTRO_POPULATE,
            },
          },
          asideImage: { populate: { media: { populate: "*" } } },
          image: { populate: "*" },
        },
      },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::use-case.use-case",
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
      ensureTitle,
      // Set fullPath: use-cases live at /solutions/{slug}
      ((entity) => ({
        ...entity,
        fullPath: `/solutions/${entity["slug"] as string}`,
      })) as TransformFn,
      remapDynamicZone("slices", "content"),
      // Prepend hero from useCaseHero → hero.intro (label-title-text-links + image)
      ((entity) => {
        const result = { ...entity }
        const useCaseHero = asRecord(result["useCaseHero"])
        delete result["useCaseHero"]

        const heroBlock = asRecord(useCaseHero["hero"])
        const intro = asRecord(heroBlock["intro"])

        if (intro["title"]) {
          const heroEntry = introToHeroDzEntry(intro)

          const heroImage =
            useCaseHero["asideImage"] ??
            heroBlock["image"] ??
            useCaseHero["image"]

          const wrappedImage = wrapV4Media(heroImage)
          if (wrappedImage) {
            heroEntry.image = wrappedImage
          }

          return prependToContent(result, heroEntry)
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },

  "strapi-features": {
    sourceEndpoint: "strapi-features",
    sourcePopulate: DEEP_DZ_POPULATE,
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::strapi-feature.strapi-feature",
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
      ensureTitle,
      remapDynamicZone("slices", "content"),
      transformSeo,
      uploadMedia,
    ],
  },

  // ═════════════════════════════════════════
  // GLOBAL → HEADER & FOOTER SINGLE TYPES
  // ═════════════════════════════════════════

  navbar: {
    sourceEndpoint: "global",
    singleType: true,
    sourcePopulate: {
      header: {
        populate: {
          panels: {
            populate: {
              navigationLabel: {
                populate: { icons: { populate: "*" } },
              },
              sections: {
                populate: {
                  links: { populate: { icons: { populate: "*" } } },
                },
              },
              arrowLinks: { populate: { icons: { populate: "*" } } },
              pushs: {
                populate: {
                  image: { populate: "*" },
                  link: { populate: "*" },
                },
              },
              buttonIcons: { populate: "*" },
            },
          },
          home: { populate: { icons: { populate: "*" } } },
          button: { populate: { link: { populate: "*" } } },
          lowerLinks: { populate: { icons: { populate: "*" } } },
        },
      },
    },
    targetEndpoint: "header",
    targetSingleType: true,
    dedupField: "content",
    sourceUid: "api::global.global",
    transforms: [
      flattenV4,
      // Extract header component and build v5 navbar dynamic zone
      ((entity) => {
        const header = asRecord(entity["header"])
        const panels = asArray(header["panels"])
        const home = asRecord(header["home"])
        const button = asRecord(header["button"])
        const lowerLinks = asArray(header["lowerLinks"])

        // home link → logoImage (link-image with icon)
        const logoImage = convertV4LinkImage(home)

        // panels → navItems
        const navItems = panels.map((panel) => {
          const navLabel = asRecord(panel["navigationLabel"])
          const sections = asArray(panel["sections"])

          return {
            link: convertV4LinkText(navLabel),
            sections: sections.map((section) => ({
              title: (section["title"] as string) ?? "",
              columns: 1,
              items: asArray(section["links"]).map((link) => {
                const icons = asArray(link["icons"])

                return {
                  link: convertV4LinkText(link),
                  description: (link["summary"] as string) ?? "",
                  icon: icons.length > 0 ? convertV4BasicImage(icons[0]) : null,
                }
              }),
            })),
          }
        })

        // lowerLinks → bottomLinks
        const bottomLinks = lowerLinks
          .map((link) => convertV4Link(link))
          .filter(Boolean)

        // button.link → ctaLinks
        const ctaLinks: Record<string, unknown>[] = []
        const buttonLink = convertV4Link(asRecord(button["link"]))
        if (buttonLink) ctaLinks.push(buttonLink)

        return {
          content: [
            {
              __component: "navigation.navbar",
              logoImage,
              logoImageLight: null,
              navItems,
              bottomLinks,
              ctaLinks,
              githubStars: true,
            },
          ],
        }
      }) as TransformFn,
      uploadMedia,
    ],
  },

  footer: {
    sourceEndpoint: "global",
    singleType: true,
    sourcePopulate: {
      footer: {
        populate: {
          cta: {
            populate: {
              features: {
                populate: {
                  icon: { populate: "*" },
                  links: { populate: "*" },
                },
              },
              logos: { populate: "*" },
              links: {
                populate: {
                  icon: { populate: "*" },
                  links: { populate: "*" },
                },
              },
            },
          },
          sections: {
            populate: { links: { populate: "*" } },
          },
          sublinks: { populate: "*" },
          socials: {
            populate: {
              socials: {
                populate: {
                  icon: { populate: "*" },
                  hoverIcon: { populate: "*" },
                  link: { populate: "*" },
                },
              },
            },
          },
        },
      },
    },
    targetEndpoint: "footer",
    targetSingleType: true,
    dedupField: "content",
    sourceUid: "api::global.global:footer",
    transforms: [
      flattenV4,
      // Extract footer component and build v5 footer dynamic zone
      ((entity) => {
        const footer = asRecord(entity["footer"])
        const cta = asRecord(footer["cta"])
        const sections = asArray(footer["sections"])
        const sublinks = asArray(footer["sublinks"])
        const socials = asRecord(footer["socials"])

        // Build footer-main component
        const footerMain: Record<string, unknown> = {
          __component: "footer.footer-main",
          logoImage: null,
          tagline: (footer["tagline"] as string) ?? "",
          sections: sections.map((section) => ({
            title: (section["title"] as string) ?? "",
            links: asArray(section["links"])
              .map((link) => convertV4LinkText(link))
              .filter(Boolean),
          })),
          copyRight: (footer["copyright"] as string) ?? "",
          links: sublinks
            .map((link) => convertV4LinkText(link))
            .filter(Boolean),
          socials: {
            title: (socials["text"] as string) ?? "",
            socials: asArray(socials["socials"]).map((social) => {
              const link = asRecord(social["link"])
              const icon = convertV4BasicImage(social["icon"])

              return {
                type: "external",
                label: (link["text"] as string) ?? "",
                newTab: link["target"] === "_blank",
                href: (link["href"] as string) ?? "/",
                image: icon,
              }
            }),
          },
        }

        // Build footer-cta component from slices.summarize-benefits
        const content: Record<string, unknown>[] = [footerMain]

        if (cta["title"]) {
          const features = asArray(cta["features"])
          const logos = asArray(cta["logos"])
          const ctaLinks = asArray(cta["links"])

          const footerCta: Record<string, unknown> = {
            __component: "footer.footer-cta",
            heading: (cta["title"] as string) ?? "",
            codeSnippet: (cta["cliContent"] as string) ?? "",
            featureBadges: features.map((card) => ({
              text: (card["title"] as string) ?? "",
              icon: convertV4BasicImage(card["icon"]),
            })),
            featureLogos: logos
              .map((logo) => convertV4BasicImage(logo))
              .filter(Boolean),
            ctaCards: ctaLinks.map((card) => {
              const cardLinks = asArray(card["links"])
              const firstLink =
                cardLinks.length > 0 ? convertV4Link(cardLinks[0]) : null

              return {
                title: (card["title"] as string) ?? "",
                description: (card["text"] as string) ?? "",
                icon: convertV4BasicImage(card["icon"]),
                link: firstLink,
              }
            }),
          }

          content.unshift(footerCta)
        }

        return { content }
      }) as TransformFn,
      uploadMedia,
    ],
  },

  "integration-topics": {
    sourceEndpoint: "integration-topics",
    sourcePopulate: {
      ...DEEP_DZ_POPULATE,
      image: { populate: "*" },
    },
    targetEndpoint: "pages",
    dedupField: "slug",
    sourceUid: "api::integration-topic.integration-topic",
    transforms: [
      flattenV4,
      dropFields(
        "_v4Id",
        "createdAt",
        "updatedAt",
        "publishedAt",
        "locale",
        "settings",
        "image",
        "integration"
      ),
      ensureTitle,
      remapDynamicZone("slices", "content"),
      // Prepend section-header from flat title/description fields
      ((entity) => {
        const result = { ...entity }
        const title = (result["title"] as string) ?? ""
        const description = (result["description"] as string) ?? ""
        delete result["description"]

        if (title) {
          return prependToContent(result, {
            __component: "sections.section-header",
            section: { title, description },
          })
        }

        return result
      }) as TransformFn,
      transformSeo,
      uploadMedia,
    ],
  },
}
