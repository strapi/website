/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-process-exit */
import { SourceClient } from "../clients/source.ts"
import { ENTITY_CONFIGS } from "../config/entities.ts"
import { loadEnv } from "../config/env.ts"
import { createLogger } from "../utils/logger.ts"

const SLUG = process.argv[2] ?? "webhooks"

async function main() {
  const env = loadEnv()
  const logger = createLogger(false)
  const client = new SourceClient({ env, logger })
  const config = ENTITY_CONFIGS["blog-posts"]!

  const stubs = await client.fetchAll("blog-posts", { slugFilter: SLUG })
  const stub = stubs[0]
  if (!stub) {
    console.error("not found")
    process.exit(1)
  }

  const entity = await client.fetchOne(
    "blog-posts",
    stub.id,
    config.sourcePopulate
  )

  const slices = (entity.attributes["slices"] ?? []) as Record<
    string,
    unknown
  >[]
  for (const s of slices) {
    const comp = s["__component"]
    if (
      comp === "slices.related-posts" ||
      comp === "slices.related-blog-posts" ||
      comp === "slices.newsletter-banner" ||
      comp === "slices.embed-form"
    ) {
      console.log(`\n=== ${comp} ===`)
      console.log(JSON.stringify(s, null, 2).slice(0, 1500))
    }
  }
}

main().catch(console.error)
