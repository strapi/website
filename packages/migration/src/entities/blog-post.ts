/**
 * Blog-post-specific migration logic — pass 2.
 *
 * Pass 1 routes v4 related-posts / related-blog-posts through a
 * migration.data-sink with `sourceComponent="blog.related-posts"`, and
 * records the markers (blogPostV4Ids, categoryV4Id) in the local
 * PendingRelations state file keyed by the v5 documentId (needed because
 * data-sink's fields are `private: true` on the target schema, so we can't
 * read them back over the API).
 *
 * This module iterates PendingRelations, resolves the markers via the now-
 * complete IdMap, fetches each v5 blog-post's sections, replaces the sinks
 * (in order) with real `blog.related-posts` components, and PATCHes.
 */

import type { TransformContext } from "../transforms/base.ts"

interface V5Section {
  __component: string
  id?: number | string
  sourceComponent?: string
  [key: string]: unknown
}

interface V5BlogPost {
  documentId: string
  slug: string
  sections?: V5Section[] | null
}

function isDeferredSink(s: V5Section): boolean {
  // data-sink fields are private — we detect "ours" purely by component name,
  // and rely on section ORDER to match the marker list recorded at pass 1.
  return s.__component === "migration.data-sink"
}

export async function resolveBlogPostRelations(
  ctx: TransformContext
): Promise<{ updated: number; skipped: number; unresolved: string[] }> {
  const pending = ctx.pendingRelations
  if (!pending) {
    throw new Error("resolveBlogPostRelations requires ctx.pendingRelations")
  }

  const entries = pending.entries()
  let updated = 0
  let skipped = 0
  const unresolved: string[] = []

  ctx.logger.info(`${entries.length} blog-posts with pending relations`)

  for (const [documentId, markers] of entries) {
    if (markers.length === 0) {
      pending.delete(documentId)
      skipped++
      continue
    }

    // Fetch the v5 post's current sections
    const url =
      `${ctx.env.target.baseUrl}/api/blog-posts/${documentId}` +
      `?populate[sections][populate]=*&status=draft&locale=en`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ctx.env.target.token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      ctx.logger.warn(`fetch ${documentId}: ${res.status} ${res.statusText}`)
      unresolved.push(`${documentId}: fetch failed (${res.status})`)
      continue
    }

    const body = (await res.json()) as { data: V5BlogPost | null }
    const post = body.data
    if (!post) {
      unresolved.push(`${documentId}: post not found`)
      continue
    }

    const sections = post.sections ?? []
    const sinkIndices = sections
      .map((s, i) => (isDeferredSink(s) ? i : -1))
      .filter((i) => i >= 0)

    if (sinkIndices.length === 0) {
      // Already resolved in a prior pass — clear state
      pending.delete(documentId)
      skipped++
      continue
    }

    if (sinkIndices.length !== markers.length) {
      ctx.logger.warn(
        `/${post.slug}: ${sinkIndices.length} sinks on post vs ${markers.length} recorded markers — skipping to avoid misalignment`
      )
      unresolved.push(
        `${documentId} (/${post.slug}): sink/marker count mismatch`
      )
      continue
    }

    const nextSections: V5Section[] = []
    let markerIdx = 0

    for (const section of sections) {
      if (!isDeferredSink(section)) {
        nextSections.push(section)
        continue
      }

      const marker = markers[markerIdx++]!
      const blogPostV4Ids = marker._blogPostV4Ids ?? []
      const categoryV4Id = marker._categoryV4Id

      const resolvedBlogPosts = blogPostV4Ids
        .map((v4Id) => ctx.idMap.get("api::blog-post.blog-post", v4Id))
        .filter(Boolean) as string[]

      const resolvedCategory =
        typeof categoryV4Id === "number"
          ? ctx.idMap.get("api::post-category.post-category", categoryV4Id)
          : null

      if (resolvedBlogPosts.length === 0 && !resolvedCategory) {
        unresolved.push(
          `/${post.slug}: no v5 ids for markers (bp=[${blogPostV4Ids.join(",")}]${
            categoryV4Id ? `, cat=${categoryV4Id}` : ""
          }) — dropping sink`
        )
        // Drop the sink entirely so the page stops showing a placeholder
        continue
      }

      if (resolvedBlogPosts.length < blogPostV4Ids.length) {
        ctx.logger.warn(
          `/${post.slug}: resolved ${resolvedBlogPosts.length}/${blogPostV4Ids.length} blogPost relations`
        )
      }

      const replacement: Record<string, unknown> = {
        __component: "blog.related-posts",
      }
      if (resolvedBlogPosts.length > 0) {
        replacement["blogPosts"] = { set: resolvedBlogPosts }
      }
      if (resolvedCategory) {
        replacement["category"] = { set: [resolvedCategory] }
      }

      nextSections.push(replacement as V5Section)
    }

    if (ctx.dryRun) {
      ctx.logger.info(
        `[DRY RUN] /${post.slug} — ${sinkIndices.length} sinks → blog.related-posts`
      )
      updated++
      continue
    }

    await ctx.targetClient.update("blog-posts", documentId, {
      sections: nextSections,
    })

    pending.delete(documentId)
    updated++
    ctx.logger.debug(
      `Resolved /${post.slug}: ${sinkIndices.length} sinks → blog.related-posts`
    )
  }

  if (!ctx.dryRun) {
    await pending.save()
  }

  return { updated, skipped, unresolved }
}
