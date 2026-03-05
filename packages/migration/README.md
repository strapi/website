# @repo/migration

Migrate content from the old Strapi v4 website (`api-prod.strapi.io`) to the new Strapi v5 instance. Idempotent ETL pipeline — safe to run repeatedly without creating duplicates.

## Setup

```bash
# Copy and fill in API tokens
cp .env.example .env
```

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `SOURCE_URL`   | Old v4 instance URL          |
| `SOURCE_TOKEN` | Read-only API token for v4   |
| `TARGET_URL`   | New v5 instance URL          |
| `TARGET_TOKEN` | Full-access API token for v5 |

## Usage

```bash
# Dry-run on 5 pages — see what would be migrated + unmapped component warnings
pnpm migrate run pages --dry-run --limit 5 --verbose

# Migrate 10 pages for real
pnpm migrate run pages --limit 10

# Re-run is safe — already-migrated entries are skipped (dedup by slug)
pnpm migrate run pages --limit 10

# Filter by slug pattern
pnpm migrate run pages --slug "pricing"

# Force-overwrite existing entries
pnpm migrate run pages --limit 5 --force

# Migrate all entity types
pnpm migrate run-all --dry-run

# Check progress
pnpm migrate status

# Reset state for a fresh run
pnpm migrate reset
```

### Available entities

| Entity      | v4 source  | v5 target | Dedup field |
| ----------- | ---------- | --------- | ----------- |
| `pages`     | universals | pages     | `slug`      |
| `plans`     | plans      | plans     | `name`      |
| `redirects` | redirects  | redirects | `source`    |

## How it works

```
v4 API (read-only)          Transform chain              v5 API (write)
┌──────────────┐    ┌─────────────────────────┐    ┌──────────────────┐
│  Paginated   │───▶│  flatten v4 response     │───▶│  Dedup lookup    │
│  fetch       │    │  remap slices → content  │    │  (by slug/name)  │
│  (100/page)  │    │  transform SEO           │    │                  │
│              │    │  rewrite media URLs       │    │  Create or skip  │
└──────────────┘    └─────────────────────────┘    └──────────────────┘
                              │
                    Component mapping config
                    (src/config/components.ts)
```

**Idempotency** — before writing, the loader queries v5 by the entity's dedup field (e.g. `slug`). If it already exists, the entity is skipped (unless `--force`).

**State** — progress is persisted to `state/` (gitignored). Tracks migrated count, errors, and a v4→v5 ID map for resolving relations across entity types.

## Adding component mappings

When you dry-run, unmapped v4 components are logged as warnings:

```
WARN No mapping for component: slices.code-block — dropping
WARN No mapping for component: slices.pricing-table — dropping
```

To map them, edit `src/config/components.ts`:

```typescript
// 1:1 mapping with field passthrough
{
  source: "slices.pricing-table",
  target: "plans.plan-comparison-table",
  unmappedFields: "passthrough",
}

// Mapping with field renames
{
  source: "slices.hero-dark",
  target: "sections.section-header",
  fieldMap: {
    title: "section.title",           // nested path
    description: "section.description",
  },
}

// Mapping with value transform
{
  source: "links.button",
  target: "utilities.link",
  fieldMap: {
    text: "label",
    url: "href",
    isExternal: {
      rename: "type",
      transform: (v) => v ? "external" : "page",
    },
  },
}

// Drop a component explicitly (no warning)
{ source: "slices.code-block", target: null }
```

The workflow is iterative: dry-run → read warnings → add mappings → repeat.

## Adding new entity types

Create a config entry in `src/config/entities.ts`:

```typescript
"blog-posts": {
  sourceEndpoint: "blog-posts",       // v4 API endpoint
  sourcePopulate: "deep",             // v4 populate strategy
  targetEndpoint: "blog-posts",       // v5 API endpoint
  dedupField: "slug",                 // field for idempotency check
  sourceUid: "api::blog-post.blog-post",
  transforms: [
    flattenV4,
    dropFields("_v4Id", "createdAt", "updatedAt", "publishedAt", "locale"),
    remapDynamicZone("slices", "content"),
    transformSeo,
    rewriteMedia,
  ],
}
```

Then run: `pnpm migrate run blog-posts --dry-run --limit 3`
