# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Strapi CMS (apps/strapi)                       │
│  - Content management                                                       │
│  - REST API with document middleware                                        │
│  - PostgreSQL (Docker)                                                      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ REST API
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js Frontend (apps/ui)                        │
│  - App Router with catch-all routing                                        │
│  - Server/client Strapi clients with proxy                                  │
│  - Page builder component registry                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Page Builder

Strapi component UIDs map to React components via a central registry.

- Strapi: Dynamic zone components in `src/components/{category}/`
- Next.js: React components in `components/page-builder/components/{category}/`
- Registry: `components/page-builder/index.tsx`

See [Page Builder](./page-builder.md) for details.

## Strapi API Clients

`PublicStrapiClient` handles content fetching using API key authentication.

Client-side requests use a proxy route (`/api/public-proxy`) to hide the Strapi URL.

See [Strapi API Client](./strapi-api-client.md) for details.

## Routing

- Catch-all `[locale]/[[...rest]]` renders Strapi-managed pages
- Locale extracted from URL, passed to API queries

## Internationalization

Dual i18n system:

| System      | Purpose    | Location                    |
| ----------- | ---------- | --------------------------- |
| next-intl   | UI strings | `src/locales/{locale}.json` |
| Strapi i18n | Content    | `locale` query parameter    |

## Environment Variables

Validated via `@t3-oss/env-nextjs`. Access through `getEnvVar()`.

Files bootstrapped from `.example` files on `pnpm install`.

## Pages Hierarchy

Pages use parent-child relations for URL structure. `fullPath` auto-generated from slug chain.

See [Pages Hierarchy](./pages-hierarchy.md) for workflow.
