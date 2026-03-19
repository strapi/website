import type { TargetClient, V5Entity } from "../clients/target.ts"
import type { Logger } from "../utils/logger.ts"

/**
 * Map of entity config name → { endpoint, dzField } for all entities
 * that use a dynamic zone (remapDynamicZone in their transforms).
 */
const DZ_ENTITIES: Record<string, { endpoint: string; dzField: string }> = {
  // sections DZ
  integrations: { endpoint: "integrations", dzField: "sections" },
  partners: { endpoint: "partners", dzField: "sections" },
  "blog-posts": { endpoint: "blog-posts", dzField: "sections" },
  "cms-pages": { endpoint: "cmses", dzField: "sections" },

  // content DZ
  "case-studies": { endpoint: "case-studies", dzField: "content" },
  "cms-comparisons": { endpoint: "cms-comparisons", dzField: "content" },
  pages: { endpoint: "pages", dzField: "content" },
}

export interface SinkEntry {
  sourceComponent: string
  entityType: string
  slug: string
  documentId: string
  data: Record<string, unknown>
}

export interface SinkAuditReport {
  timestamp: string
  totalSinks: number
  totalEntitiesWithSinks: number
  totalEntitiesScanned: number
  sinks: SinkEntry[]
  bySourceComponent: Record<
    string,
    {
      count: number
      entities: { type: string; slug: string; documentId: string }[]
      sampleData: Record<string, unknown>
    }
  >
  byEntityType: Record<
    string,
    {
      totalEntities: number
      entitiesWithSinks: number
      sinkCount: number
    }
  >
}

interface AuditSinksOptions {
  targetClient: TargetClient
  logger: Logger
  include?: string[]
  verbose?: boolean
}

export async function auditSinks(
  opts: AuditSinksOptions
): Promise<SinkAuditReport> {
  const { targetClient, logger, include, verbose } = opts

  const entries = include
    ? Object.entries(DZ_ENTITIES).filter(([name]) => include.includes(name))
    : Object.entries(DZ_ENTITIES)

  const sinks: SinkEntry[] = []
  let totalScanned = 0

  const byEntityType: SinkAuditReport["byEntityType"] = {}

  for (const [name, { endpoint, dzField }] of entries) {
    logger.info(`Scanning ${name} (${endpoint}.${dzField})...`)

    const entities = await targetClient.list(endpoint, {
      [dzField]: { populate: "*" },
    })

    const entitySinkCounts = scanEntities(entities, dzField, name, sinks)

    byEntityType[name] = {
      totalEntities: entities.length,
      entitiesWithSinks: entitySinkCounts.withSinks,
      sinkCount: entitySinkCounts.total,
    }

    totalScanned += entities.length

    if (verbose) {
      logger.debug(
        `  ${entities.length} entities, ${entitySinkCounts.total} sinks`
      )
    }
  }

  // Group by source component
  const bySourceComponent: SinkAuditReport["bySourceComponent"] = {}

  for (const sink of sinks) {
    const key = sink.sourceComponent

    if (!bySourceComponent[key]) {
      bySourceComponent[key] = {
        count: 0,
        entities: [],
        sampleData: sink.data,
      }
    }

    bySourceComponent[key].count++
    bySourceComponent[key].entities.push({
      type: sink.entityType,
      slug: sink.slug,
      documentId: sink.documentId,
    })
  }

  const entitiesWithSinks = new Set(
    sinks.map((s) => `${s.entityType}:${s.documentId}`)
  )

  return {
    timestamp: new Date().toISOString(),
    totalSinks: sinks.length,
    totalEntitiesWithSinks: entitiesWithSinks.size,
    totalEntitiesScanned: totalScanned,
    sinks,
    bySourceComponent,
    byEntityType,
  }
}

function scanEntities(
  entities: V5Entity[],
  dzField: string,
  entityType: string,
  sinks: SinkEntry[]
): { total: number; withSinks: number } {
  let total = 0
  let withSinks = 0

  for (const entity of entities) {
    const dz = entity[dzField]
    if (!Array.isArray(dz)) continue

    let entityHasSink = false

    for (const component of dz) {
      if (
        typeof component === "object" &&
        component !== null &&
        (component as Record<string, unknown>).__component ===
          "migration.data-sink"
      ) {
        const comp = component as Record<string, unknown>
        entityHasSink = true
        total++

        sinks.push({
          sourceComponent: (comp.sourceComponent as string) ?? "unknown",
          entityType,
          slug: (entity.slug as string) ?? String(entity.documentId),
          documentId: entity.documentId,
          data: comp,
        })
      }
    }

    if (entityHasSink) withSinks++
  }

  return { total, withSinks }
}
