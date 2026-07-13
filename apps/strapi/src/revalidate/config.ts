import type { UID } from "@strapi/strapi"

export const RevalidateModes = Object.freeze({
  Tag: "tag-revalidate" as const,
  Path: "path-revalidate" as const,
})

export const RevalidatePolicies = Object.freeze({
  PublishOnly: "publish-only" as const,
  AllWrites: "all-writes" as const,
})

export type RevalidateMode =
  | typeof RevalidateModes.Tag
  | typeof RevalidateModes.Path
export type RevalidatePolicy =
  | typeof RevalidatePolicies.PublishOnly
  | typeof RevalidatePolicies.AllWrites

export type PathBuilder = (
  doc: Record<string, unknown>,
  locale?: string
) => string | string[] | null | undefined

export type RevalidateCollectionConfig = {
  uid: UID.ContentType
  mode: RevalidateMode
  policy?: RevalidatePolicy
  pathField?: string
  pathBuilder?: PathBuilder
  tags?: string[]
}

/**
 * Path-builders synthesize URL paths for content types that don't store a
 * `fullPath` field. Keep them in sync with the corresponding Next.js routes
 * under `apps/ui/src/app/[locale]/...`.
 *
 * Consumed by:
 *  - `documentMiddlewares/revalidate.ts` — auto-revalidation on writes
 *  - `admin/extensions/DataRevalidate/DataRevalidateButton.tsx` — manual button
 */
export const REVALIDATE_COLLECTIONS: RevalidateCollectionConfig[] = [
  // Hierarchical pages — fullPath is stored on the document itself.
  {
    uid: "api::page.page",
    mode: RevalidateModes.Path,
    pathField: "fullPath",
  },

  // Flat collection types — paths synthesized from slug.
  // Mirrors `apps/ui/src/app/[locale]/blog/[slug]/page.tsx`.
  {
    uid: "api::blog-post.blog-post",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/blog/${slug}` : null
    },
  },
  // Mirrors `apps/ui/src/app/[locale]/blog/categories/[slug]/page.tsx`.
  // Cross-tags blog-post (category chips on post cards/headers) and blog
  // (category names in the blog navigation single type).
  {
    uid: "api::post-category.post-category",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/blog/categories/${slug}` : null
    },
    tags: ["strapi:api::blog-post.blog-post", "strapi:api::blog.blog"],
  },
  // Mirrors `apps/ui/src/app/[locale]/blog/tags/[slug]/page.tsx`. Also
  // cross-tags blog-post since tag chips render in BlogPostHeader.
  {
    uid: "api::post-tag.post-tag",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/blog/tags/${slug}` : null
    },
    tags: ["strapi:api::blog-post.blog-post"],
  },
  // Mirrors `apps/ui/src/app/[locale]/user-stories/[slug]/page.tsx`.
  // Cross-tags page + blog-post since `cards.case-study-card` embeds
  // case-study data (title, companyName, images) in both dynamic zones.
  {
    uid: "api::case-study.case-study",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/user-stories/${slug}` : null
    },
    tags: ["strapi:api::page.page", "strapi:api::blog-post.blog-post"],
  },
  // Mirrors `apps/ui/src/app/[locale]/headless-cms/comparison/[slug]/page.tsx`.
  {
    uid: "api::cms-comparison.cms-comparison",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/headless-cms/comparison/${slug}` : null
    },
  },
  // Authors are users-permissions users; mirrors
  // `apps/ui/src/app/[locale]/user/[slug]/page.tsx`. No draftAndPublish →
  // all-writes policy; slug-less writes (auth flows) resolve to no paths and
  // are skipped. Cross-tags blog-post since bylines render author data.
  {
    uid: "plugin::users-permissions.user",
    mode: RevalidateModes.Path,
    pathBuilder: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : null

      return slug ? `/user/${slug}` : null
    },
    tags: ["strapi:api::blog-post.blog-post"],
  },

  // Single types — purely tag-revalidated (no public landing page of their own).
  { uid: "api::header.header", mode: RevalidateModes.Tag },
  { uid: "api::footer.footer", mode: RevalidateModes.Tag },
  { uid: "api::global.global", mode: RevalidateModes.Tag },
  { uid: "api::not-found.not-found", mode: RevalidateModes.Tag },
  // Blog single type powers /blog index, post pages, and category pages —
  // emit cross-tags to invalidate all of them.
  {
    uid: "api::blog.blog",
    mode: RevalidateModes.Tag,
    tags: [
      "strapi:api::blog-post.blog-post",
      "strapi:api::post-category.post-category",
    ],
  },

  // Collection types embedded into other pages — invalidate the host pages
  // via cross-tags rather than their own paths.
  {
    uid: "api::cms.cms",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::cms-comparison.cms-comparison"],
  },
  {
    uid: "api::news-item.news-item",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::page.page"],
  },
  {
    uid: "api::plan.plan",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::page.page"],
  },
  {
    uid: "api::plan-feature.plan-feature",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::page.page"],
  },
  {
    uid: "api::review.review",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::page.page"],
  },
  {
    uid: "api::tech-stack.tech-stack",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::page.page"],
  },
  {
    uid: "api::blog-tag.blog-tag",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::blog-post.blog-post"],
  },
  // Referenced by the `forms.*` components (pages, blog posts) and the
  // blog single type's newsletter component.
  {
    uid: "api::hubspot-form.hubspot-form",
    mode: RevalidateModes.Tag,
    tags: [
      "strapi:api::page.page",
      "strapi:api::blog-post.blog-post",
      "strapi:api::blog.blog",
    ],
  },
  // Renders on case-study detail pages and the /user-stories listing.
  {
    uid: "api::case-study-category.case-study-category",
    mode: RevalidateModes.Tag,
    tags: ["strapi:api::case-study.case-study"],
  },
]

export const REVALIDATE_BY_UID = new Map(
  REVALIDATE_COLLECTIONS.map((collection) => [collection.uid, collection])
)
