# Strapi + Next.js Monorepo

Monorepo starter with Strapi v5 CMS and Next.js 16 frontend. Uses pnpm workspaces with Turborepo.

## Core instructions

- Save any screenshots or tmp files to tmp/

## Workspaces

| Path                     | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `apps/ui`                | Next.js 16 (App Router, React 19, TailwindCSS v4, Shadcn/ui) |
| `apps/strapi`            | Strapi v5 CMS (PostgreSQL via Docker)                        |
| `packages/strapi-types`  | Auto-generated TypeScript types from Strapi schemas          |
| `packages/design-system` | Shared TailwindCSS tokens and styles                         |
| `packages/shared-data`   | Shared constants and types                                   |
| `qa/tests/playwright`    | E2E and accessibility tests                                  |

## Essential Commands

```bash
pnpm dev              # Start both apps (Docker required for DB)
pnpm build            # Build all
pnpm lint             # ESLint all packages
pnpm typecheck        # Typecheck (run from apps/ui)
```

See [docs/commands.md](docs/commands.md) for full command reference.

## Type Generation (Critical)

After ANY Strapi schema change, run this immediately and autonomously — do not ask the user first:

```bash
cd apps/strapi && pnpm generate:types
```

This updates `@repo/strapi-types`. Forgetting causes silent type mismatches between apps.

`generate:types` is a one-shot script, not a long-running server — it is safe to run at any time.
If the command fails, block the current task and ask the user to restart Strapi, then re-run it.

## Documentation

- [Commands Reference](docs/commands.md) — All pnpm commands
- [Architecture](docs/architecture.md) — System design and patterns
- [Page Builder](docs/page-builder.md) — Component registry and rendering
- [Strapi API Client](docs/strapi-api-client.md) — Fetching content from Strapi
- [Pages Hierarchy](docs/pages-hierarchy.md) — URL structure and redirects
- [Strapi Schemas](docs/strapi-schemas.md) — Schema attributes, localization, lifecycle hooks
- [Strapi Types](docs/strapi-types-usage.md) — Type utilities and usage patterns

## Running Services

**Never launch dev servers (`pnpm dev`, `strapi develop`, `next dev`) in the background.** These spawn long-running processes that are hard to kill from within the agent.

## Strapi Data Safety

### Dynamic zone writes — merge, never replace

Strapi PUT requests **replace** the entire field value. Always GET first, append, then PUT.

```
// WRONG — wipes existing content
PUT { "data": { "content": [{ "__component": "sections.new", ... }] } }

// RIGHT — preserves existing
GET → content = [{ existing1 }, { existing2 }]
PUT { "data": { "content": [{ existing1 }, { existing2 }, { "__component": "sections.new", ... }] } }
```

## Commits

Uses conventional commits enforced by Husky + commitlint.

```bash
pnpm commit
```

Or write manually: `type(scope): subject`
