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

After ANY Strapi schema change:

```bash
cd apps/strapi && pnpm generate:types
```

This updates `@repo/strapi-types`. Forgetting causes silent type mismatches between apps.

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

**Never kill or restart running services.** Do not use `kill`, `pkill`, or any signal to terminate dev servers. Schema changes require a Strapi restart — ask the user to do it manually.

Before any skill that needs a running server:

1. Check if the port is already in use: `lsof -ti:PORT` (Strapi: `1337`, Next.js: `3000`).
2. If the port is active, assume the server is running — do not start another instance.
3. If the port is free and the skill needs it, ask the user to start the server themselves in a separate terminal. Wait for confirmation before proceeding.

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

### Schema changes require server restart before writes

After creating new schema files, the running Strapi server does not know about them. Writing unknown `__component` UIDs corrupts data.

1. Create schema files, populate configs, registry entries.
2. Ask the user to restart Strapi. Wait for confirmation.
3. Only then seed content via MCP.

## Commits

Uses conventional commits enforced by Husky + commitlint.

```bash
pnpm commit    # Interactive Commitizen flow
```

Or write manually: `type(scope): subject`
