import { writeFile } from "node:fs/promises"

import { SourceClient } from "../clients/source.ts"
import { TargetClient } from "../clients/target.ts"
import { COMPONENT_MAP } from "../config/components.ts"
import { ENTITY_CONFIGS } from "../config/entities.ts"
import { loadEnv } from "../config/env.ts"
import { runTransforms } from "../pipeline/transform.ts"
import { IdMap } from "../state/id-map.ts"
import { MediaCache } from "../state/media-cache.ts"
import { PendingRelations } from "../state/pending-relations.ts"
import { createTransformContext } from "../transforms/base.ts"
import { createLogger } from "../utils/logger.ts"

const v4Id = Number(process.argv[2] ?? 556)

const env = loadEnv()
const logger = createLogger(false)
const idMap = new IdMap()
await idMap.load()
const mediaCache = new MediaCache()
await mediaCache.load()
const pendingRelations = new PendingRelations()
await pendingRelations.load()

const ctx = {
  ...createTransformContext({ env, idMap, logger, dryRun: true, force: false }),
  sourceClient: new SourceClient({ env, logger }),
  targetClient: new TargetClient({ env, logger }),
  componentMap: COMPONENT_MAP,
  mediaCache,
  pendingRelations,
}

const config = ENTITY_CONFIGS["blog-posts"]!
const entity = await ctx.sourceClient.fetchOne(
  config.sourceEndpoint,
  v4Id,
  config.sourcePopulate
)

const flat = { ...entity.attributes, _v4Id: v4Id }
const transformed = await runTransforms(flat, config.transforms, ctx)

// eslint-disable-next-line sonarjs/publicly-writable-directories
await writeFile("/tmp/blog-payload.json", JSON.stringify(transformed, null, 2))
console.log(`Wrote /tmp/blog-payload.json for v4Id=${v4Id}`)
console.log("Top-level keys:", Object.keys(transformed))
for (const key of ["author", "coauthors", "category", "tags"]) {
  console.log(`  ${key}:`, JSON.stringify(transformed[key]))
}
