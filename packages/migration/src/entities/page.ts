/**
 * Page-specific migration logic.
 *
 * Pages in v4 are "universals" with a slug field that encodes the full path
 * (e.g. "pricing/enterprise"). Pages in v5 are hierarchical with parent-child
 * relations — slug is the leaf segment, fullPath is auto-computed from the chain.
 *
 * During migration:
 *   normalizePageSlug() strips the slug to leaf and sets fullPath from the v4 slug.
 *   resolvePageParent() looks up the parent in v5 by fullPath and sets the relation.
 *   If parent doesn't exist yet, setPageParents can be run as a post-step.
 */

import type { TransformFn, TransformContext } from "../transforms/base.ts"

/**
 * Infer parent fullPath from a page's fullPath.
 * e.g. "/pricing/enterprise" → "/pricing"
 *      "/pricing" → null (root page)
 */
export function inferParentPath(fullPath: string): string | null {
  const parts = fullPath.split("/").filter(Boolean)

  if (parts.length <= 1) return null

  return "/" + parts.slice(0, -1).join("/")
}

/**
 * Transform: normalize v4 universal slug for v5 pages.
 * - Strips slug to leaf segment (e.g., "pricing/enterprise" → "enterprise")
 * - Sets fullPath from original v4 slug (e.g., "/pricing/enterprise")
 */
export function normalizePageSlug(): TransformFn {
  return (entity) => {
    const slug = entity["slug"] as string
    if (!slug) return entity

    const parts = slug.split("/").filter(Boolean)
    const leafSlug = parts.at(-1) ?? slug
    const fullPath = "/" + parts.join("/")

    return { ...entity, slug: leafSlug, fullPath }
  }
}

/**
 * Transform: resolve parent relation by looking up parent page in v5 by fullPath.
 * Must run after normalizePageSlug which sets fullPath.
 */
export function resolvePageParent(): TransformFn {
  return async (entity, ctx) => {
    const fullPath = entity["fullPath"] as string
    if (!fullPath) return entity

    const parentPath = inferParentPath(fullPath)
    if (!parentPath) return entity

    const parent = await ctx.targetClient.findByField(
      "pages",
      "fullPath",
      parentPath
    )

    if (parent) {
      ctx.logger.debug(
        `Resolved parent: ${fullPath} → ${parentPath} (${parent.documentId})`
      )

      return { ...entity, parent: { set: [parent.documentId] } }
    }

    ctx.logger.warn(
      `Parent not found: ${fullPath} → ${parentPath} (migrate parent first)`
    )

    return entity
  }
}

/**
 * Post-migration step: set parent relations for pages that don't have one.
 * Uses fullPath to derive parent path and look up the parent page.
 * Run after all pages have been migrated via `pnpm migrate set-parents`.
 */
export async function setPageParents(
  ctx: TransformContext
): Promise<{ updated: number; unresolved: string[] }> {
  let page = 1
  let updated = 0
  const unresolved: string[] = []

  while (true) {
    const response = await fetch(
      `${ctx.env.target.baseUrl}/api/pages?pagination[page]=${page}&pagination[pageSize]=100&populate[parent][fields][0]=documentId&fields[0]=slug&fields[1]=fullPath&locale=en&status=draft`,
      {
        headers: {
          Authorization: `Bearer ${ctx.env.target.token}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = (await response.json()) as {
      data: {
        documentId: string
        slug: string
        fullPath?: string
        parent?: { documentId: string } | null
      }[]
      meta: { pagination: { pageCount: number } }
    }

    for (const pageEntry of data.data) {
      if (pageEntry.parent) continue

      const fullPath = pageEntry.fullPath
      if (!fullPath) continue

      const parentPath = inferParentPath(fullPath)
      if (!parentPath) continue

      const parent = await ctx.targetClient.findByField(
        "pages",
        "fullPath",
        parentPath
      )

      if (!parent) {
        unresolved.push(`${fullPath} → parent "${parentPath}" not found`)
        continue
      }

      if (ctx.dryRun) {
        ctx.logger.info(
          `[DRY RUN] Would set parent: ${fullPath} → ${parentPath}`
        )
        updated++
        continue
      }

      await ctx.targetClient.update("pages", pageEntry.documentId, {
        parent: { set: [parent.documentId] },
      })

      updated++
      ctx.logger.debug(`Set parent: ${fullPath} → ${parentPath}`)
    }

    if (page >= data.meta.pagination.pageCount) break
    page++
  }

  return { updated, unresolved }
}
