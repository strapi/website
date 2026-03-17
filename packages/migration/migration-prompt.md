# Migration CLI: Complete Schema Mappings

## Your Goal

Complete and validate ALL entity migration configs and component mappings in the migration CLI (`packages/migration/`). Every v4 content field must map to an existing v5 component — no content left behind, no new Strapi schemas created.

## Critical Rules

1. **NEVER run without --limit.** Always use `--limit 1` or `--limit 2` for test runs. Never migrate all entities at once.
2. **NEVER create new Strapi components or content types.** Only map to existing v5 schemas. If no perfect match exists, use the closest available component (feature-card, content-card, section-header, two-column-grid are the catch-all generics).
3. **ONE entity at a time.** Complete one entity type fully (validate mappings → test run → fix errors → confirm output) before moving to the next.
4. **Respect dependency order.** Taxonomy/lookup entities must be migrated before entities that reference them (see ENTITY_CONFIGS ordering in entities.ts).
5. **Do not modify state files manually.** Only the CLI should write to `state/`.
6. **Do not ask the user anything.** Make your best judgment call for ambiguous mappings. Document decisions in the progress file.

## Strapi Instance Management

The migration CLI writes to a **local Strapi v5 instance** running at `http://localhost:1337`. You are responsible for keeping it alive throughout the entire migration process.

### Startup

Before running any migration command, verify Strapi is reachable:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/admin
```

If it returns anything other than `200`, start Strapi:

```bash
cd apps/strapi && pnpm develop &
```

Wait for it to be ready (poll the health endpoint every 5 seconds, up to 120 seconds):

```bash
for i in $(seq 1 24); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/admin 2>/dev/null)
  if [ "$STATUS" = "200" ]; then echo "Strapi ready"; break; fi
  sleep 5
done
```

### Recovery — Port Conflict or Frozen Instance

If Strapi fails to start (port already in use) or stops responding mid-migration:

```bash
# Kill whatever is on port 1337
lsof -ti:1337 | xargs kill -9 2>/dev/null

# Wait a moment for the port to free
sleep 2

# Restart
cd apps/strapi && pnpm develop &
```

Then re-poll `/admin` for `200` before continuing migration.

### When to Check

- **Before each entity migration** — quick health check
- **After any migration command fails with a network/connection error** — Strapi may have crashed
- **If you see ECONNREFUSED or timeout errors** — restart immediately

Do not get stuck retrying migration commands against a dead Strapi. Always verify the instance first, restart if needed, then retry the migration command.

## Key File Locations

| File                                                | Purpose                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/migration/src/config/entities.ts`         | Entity migration configs (source → target + transforms)              |
| `packages/migration/src/config/components.ts`       | Component mappings (v4 dynamic zone UIDs → v5 UIDs)                  |
| `packages/migration/v4-schemas.json`                | Full v4 schema dump — use as source-of-truth for v4 field structures |
| `packages/migration/v4-schema-reference.md`         | Human-readable v4 component docs                                     |
| `apps/strapi/src/components/**/*.json`              | v5 component schemas (target)                                        |
| `apps/strapi/src/api/*/content-types/*/schema.json` | v5 content type schemas (target)                                     |
| `website-2020/`                                     | Old v4 project (if you need to cross-reference Strapi admin schemas) |

## CLI Commands

```bash
# Dry run — shows unmapped components as warnings, no writes
cd packages/migration && pnpm migrate run <entity> --dry-run --limit 2 --verbose

# Real test run — writes to v5 API
pnpm migrate run <entity> --limit 1 --verbose

# Check progress
pnpm migrate status

# Force re-migrate (overwrite existing)
pnpm migrate run <entity> --limit 1 --force --verbose
```

The CLI runs TypeScript directly via `node --experimental-strip-types` — no build step needed. Changes to `.ts` files take effect immediately.

## Dynamic Zones Are Not Just on Pages

The `COMPONENT_MAP` in `components.ts` is shared across ALL entities that use `remapDynamicZone`. These 7 entities have dynamic zones with v4 slice components that need mapping:

| Entity            | v4 DZ field | v5 DZ field | Notes                                           |
| ----------------- | ----------- | ----------- | ----------------------------------------------- |
| `pages`           | slices      | content     | Most diverse — uses nearly every component type |
| `integrations`    | slices      | sections    | Integration-specific slices + generic ones      |
| `partners`        | slices      | sections    | Partner-specific sections                       |
| `case-studies`    | slices      | content     | Case study detail page components               |
| `blog-posts`      | slices      | sections    | Rich content blocks in posts                    |
| `cms-pages`       | slices      | sections    | CMS comparison feature sections                 |
| `cms-comparisons` | slices      | content     | CMS comparison detail content                   |

When you add or fix a component mapping, dry-run **all 7 entities** (not just pages) to verify the mapping works everywhere. Different entities may use the same v4 component with different data shapes or missing fields — the transform must handle all cases gracefully.

## Workflow Per Entity

For each entity type in ENTITY_CONFIGS:

### Phase 1: Audit

1. Read the entity config in `entities.ts` — understand sourceEndpoint, populate, transforms
2. Run `pnpm migrate run <entity> --dry-run --limit 2 --verbose`
3. Check output for:
   - "No mapping for component: ..." warnings → needs new mapping in `components.ts`
   - Transform errors → fix transform logic
   - Missing populate fields → data comes back null when it shouldn't

### Phase 2: Fix Mappings

4. For each unmapped component:
   - Look up its v4 schema in `v4-schemas.json` or `v4-schema-reference.md`
   - Find the best v5 target in `apps/strapi/src/components/`
   - Add mapping to `components.ts` with a `transform` function that preserves all meaningful content
5. For missing populate: update `sourcePopulate` in the entity config
6. Changes take effect immediately (no build step needed)

### Phase 3: Test

7. Verify Strapi is running (health check on port 1337)
8. Run `pnpm migrate run <entity> --limit 1 --verbose` (real write)
9. Verify the created entity has all expected content by examining the CLI output
10. If errors: fix and re-run with `--force --limit 1`

### Phase 4: Log

11. Update `packages/migration/MIGRATION-PROGRESS.md` with:
    - Entity name
    - Status: done / partial / blocked
    - Components mapped (new ones you added)
    - Decisions made (e.g., "mapped slices.interview → null because no v5 equivalent for interview layout")
    - Any remaining warnings

Then move to the next entity.

## Entity Processing Order

Process in this exact order (matches dependency graph):

**Tier 1 — Standalone lookups (no dependencies):**
countries, cities, tech-stacks, partner-services, case-study-categories, integration-categories

**Tier 2 — Blog taxonomy:**
blog-categories, blog-tags, post-categories, post-tags

**Tier 3 — Simple entities:**
reviews, news-items, redirects, plans, hubspot-forms

**Tier 4 — Entities with relations (depend on Tier 1-3):**
integrations, partners, case-studies, blog-posts

**Tier 5 — CMS entities:**
cms-pages, cms-comparisons

**Tier 6 — Pages (most complex, depend on everything):**
pages

## Special: HubSpot Forms

The v5 project has a `hubspot-forms` collection type that stores unique form definitions (portalId, formId, region, name). The v4 project embedded HubSpot config inline in page components.

Migration approach:

1. First migrate `hubspot-forms` entity to create the collection entries
2. In component mappings, any v4 component that embedded HubSpot data should map to `forms.hubspot-form` which has a **relation** field pointing to the hubspot-forms collection type
3. During transform: look up or create the hubspot-form entry, then reference it by documentId

## Special: SEO

v4 uses `shared.seo` with `canonicalURL` (uppercase). v5 uses `seo-utilities.seo` with `canonicalUrl` (camelCase). The `transformSeo` function handles this — make sure every entity with SEO data includes it in the transform chain.

## Special: Component Target `null`

Setting `target: null` in COMPONENT_MAP means "intentionally drop this component." Use this ONLY for:

- Relation-based list components (e.g., related-blog-posts) that dynamically fetch data
- Deprecated interactive widgets with no v5 equivalent
- Embeds/third-party integrations we're not migrating

Do NOT drop components that contain text content, images, or other meaningful data. Map them to the closest v5 generic.

## Validation Checklist (for each entity)

- [ ] Dry run shows zero "No mapping" warnings (or only intentionally-dropped ones)
- [ ] Test run with --limit 1 succeeds (HTTP 200/201)
- [ ] Created entity in v5 has all expected fields populated
- [ ] Relations resolve correctly (check IdMap)
- [ ] Media URLs are uploaded (check media-cache.json growing)
- [ ] SEO data is present if the entity has it
- [ ] Dynamic zone content is populated (not empty array)

## Starting State

Begin by:

1. Ensuring Strapi is running at localhost:1337 (start it if not)
2. Creating `packages/migration/MIGRATION-PROGRESS.md` as your working log
3. Running `pnpm migrate status` to see current state

Start from Tier 1 and work forward. For entities that already have configs, still audit them — validate the mappings are complete and the populate covers all nested fields.
