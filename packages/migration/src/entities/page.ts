/**
 * Page-specific migration logic.
 *
 * Pages in v4 are "universals" with a slug field.
 * Pages in v5 are hierarchical (parent-child) with fullPath derived from slug chain.
 *
 * Migration strategy (2-pass):
 *   Pass 1: Migrate all pages flat (no parent relation)
 *   Pass 2: Set parent relations using IdMap
 *
 * The hierarchy reconstruction is a post-migration step because parent pages
 * must exist in v5 before children can reference them.
 *
 * Note: v4 universals don't have explicit parent relations — hierarchy
 * is implicit in the slug (e.g. "/pricing/enterprise" implies parent "/pricing").
 * We'll need to reconstruct this from slug patterns.
 */

import type { TransformContext } from "../transforms/base.ts"

/**
 * Infer parent slug from a page slug.
 * e.g. "pricing/enterprise" → "pricing"
 *      "pricing" → null (root page)
 *      "blog/post-1" → "blog"
 */
export function inferParentSlug(slug: string): string | null {
  const parts = slug.split("/").filter(Boolean)

  if (parts.length <= 1) return null

  return parts.slice(0, -1).join("/")
}

/**
 * After all pages are migrated flat, set parent relations.
 * Looks up parent by slug in v5 and sets the relation.
 */
export async function setPageParents(
  ctx: TransformContext
): Promise<{ updated: number; unresolved: string[] }> {
  let page = 1
  let updated = 0
  const unresolved: string[] = []

  while (true) {
    const response = await fetch(
      `${ctx.env.target.baseUrl}/api/pages?pagination[page]=${page}&pagination[pageSize]=100&locale=en&status=draft`,
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
        parent?: { documentId: string } | null
      }[]
      meta: { pagination: { pageCount: number } }
    }

    for (const pageEntry of data.data) {
      if (pageEntry.parent) continue

      const parentSlug = inferParentSlug(pageEntry.slug)
      if (!parentSlug) continue

      const parent = await ctx.targetClient.findByField(
        "pages",
        "slug",
        parentSlug
      )

      if (!parent) {
        unresolved.push(`${pageEntry.slug} → parent "${parentSlug}" not found`)
        continue
      }

      if (ctx.dryRun) {
        ctx.logger.info(
          `[DRY RUN] Would set parent: ${pageEntry.slug} → ${parentSlug}`
        )
        updated++
        continue
      }

      await ctx.targetClient.update("pages", pageEntry.documentId, {
        parent: { documentId: parent.documentId },
      })

      updated++
      ctx.logger.debug(`Set parent: ${pageEntry.slug} → ${parentSlug}`)
    }

    if (page >= data.meta.pagination.pageCount) break
    page++
  }

  return { updated, unresolved }
}
