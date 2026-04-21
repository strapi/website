/* eslint-disable unicorn/no-process-exit */
/**
 * Runs the blog-posts transform pipeline in "pure" mode (no target writes,
 * no idMap resolution failures aborting) and dumps the transformed sections
 * for each specified slug so we can eyeball the mapping output.
 *
 * Usage:
 *   node --experimental-strip-types --env-file=.env \
 *     src/scripts/validate-blog-post-transforms.ts "slug1,slug2,..."
 */

import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { SourceClient } from "../clients/source.ts"
import { TargetClient } from "../clients/target.ts"
import { ENTITY_CONFIGS } from "../config/entities.ts"
import { loadEnv } from "../config/env.ts"
import { prewarmIdMap } from "../pipeline/prewarm.ts"
import { runTransforms } from "../pipeline/transform.ts"
import { IdMap } from "../state/id-map.ts"
import { MediaCache } from "../state/media-cache.ts"
import { createTransformContext } from "../transforms/base.ts"
import { createLogger } from "../utils/logger.ts"

const SLUGS_ARG = process.argv[2]
if (!SLUGS_ARG) {
  console.error("Usage: script <comma-separated-slugs>")
  process.exit(1)
}

const slugs = SLUGS_ARG.split(",")
  .map((s) => s.trim())
  .filter(Boolean)

async function main() {
  const env = loadEnv()
  const logger = createLogger(false)

  const idMap = new IdMap()
  const mediaCache = new MediaCache()
  await mediaCache.load()

  const blogPostConfig = ENTITY_CONFIGS["blog-posts"]
  if (blogPostConfig?.dependencies?.length) {
    const depCfgs = blogPostConfig.dependencies.flatMap((name) => {
      const cfg = ENTITY_CONFIGS[name]

      return cfg ? [cfg] : []
    })
    await prewarmIdMap({ env, idMap, logger }, depCfgs)
  }

  const { COMPONENT_MAP } = await import("../config/components.ts")

  const ctx = {
    ...createTransformContext({
      env,
      idMap,
      logger,
      dryRun: true,
      force: false,
    }),
    sourceClient: new SourceClient({ env, logger }),
    targetClient: new TargetClient({ env, logger }),
    componentMap: COMPONENT_MAP,
    mediaCache,
  }

  const config = ENTITY_CONFIGS["blog-posts"]!

  // Run uploadMedia? No — skip media-related transforms that would slow us down
  // We're validating structural transforms only. uploadMedia is dry-run-aware
  // and just logs, so leave it in.

  const results: {
    slug: string
    componentsBefore: string[]
    componentsAfter: string[]
    sections: unknown
    hasEmptyRelatedPosts: boolean
  }[] = []

  for (const slug of slugs) {
    const stubs = await ctx.sourceClient.fetchAll("blog-posts", {
      slugFilter: slug,
    })
    const stub = stubs[0]
    if (!stub) {
      console.error(`not found: ${slug}`)
      continue
    }

    const entity = await ctx.sourceClient.fetchOne(
      "blog-posts",
      stub.id,
      config.sourcePopulate
    )

    const flat: Record<string, unknown> = {
      ...entity.attributes,
      _v4Id: stub.id,
    }

    const sourceSlices = (flat["slices"] ?? []) as { __component: string }[]
    const componentsBefore = sourceSlices
      .map((s) => s.__component)
      .filter(Boolean)

    let transformed: Record<string, unknown>
    try {
      transformed = await runTransforms(flat, config.transforms, ctx)
    } catch (e) {
      console.error(`${slug}: transform error`, e)
      continue
    }

    const targetSections = (transformed["sections"] ?? []) as {
      __component: string
      blogPosts?: unknown
    }[]
    const componentsAfter = targetSections.map((s) => s.__component)

    const hasEmptyRelatedPosts = targetSections.some(
      (s) =>
        s.__component === "migration.data-sink" &&
        ((s as Record<string, unknown>)["sourceComponent"] ===
          "slices.related-posts" ||
          (s as Record<string, unknown>)["sourceComponent"] ===
            "slices.related-blog-posts" ||
          (s as Record<string, unknown>)["sourceComponent"] ===
            "blog.related-posts")
    )

    results.push({
      slug,
      componentsBefore,
      componentsAfter,
      sections: targetSections,
      hasEmptyRelatedPosts,
    })

    console.log(
      `\n=== ${slug} ===\n  source: ${componentsBefore.join(", ")}\n  target: ${componentsAfter.join(", ")}`
    )
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const outPath = path.join(
    __dirname,
    "..",
    "..",
    "reports",
    `validate-${Date.now()}.json`
  )
  await writeFile(outPath, JSON.stringify(results, null, 2))
  console.log(`\nWrote ${outPath}`)
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error(err)
  process.exit(1)
})
