# Strapi API Client

The Strapi API client provides a type-safe interface for fetching content from Strapi CMS. It uses API key authentication with a proxy route for security.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Next.js Frontend                                 │
│                                                                             │
│  Server Components                     Client Components                    │
│  ┌─────────────────────┐               ┌─────────────────────┐              │
│  │ PublicStrapiClient  │               │ PublicStrapiClient  │              │
│  └──────────┬──────────┘               │ (useProxy: true)    │              │
│             │ direct                   └──────────┬──────────┘              │
│             │                          ┌──────────▼──────────┐              │
│             │                          │  /api/public-proxy  │              │
│             │                          └──────────┬──────────┘              │
└─────────────┼─────────────────────────────────────┼─────────────────────────┘
              │                                     │
              │           + Auth headers            │
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Strapi CMS                                     │
│                          /api/pages, /api/footer, etc.                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Client Classes

### BaseStrapiClient

Abstract base class with shared fetch methods.

**`apps/ui/src/lib/strapi-api/base.ts`**

Key features:

- Automatic locale handling
- Response parsing and error handling
- Configurable caching (dev: no cache, prod: 60s revalidation)
- UID-to-endpoint mapping via `API_ENDPOINTS`

### PublicClient

For read/write operations using API key authentication.

**`apps/ui/src/lib/strapi-api/public.ts`**

- Uses `STRAPI_REST_READONLY_API_KEY` for GET/HEAD requests
- Uses `STRAPI_REST_CUSTOM_API_KEY` for write operations
- Supports proxy mode for client-side requests

## Client Instance

Pre-instantiated client exported from `apps/ui/src/lib/strapi-api/index.ts`:

```typescript
import { PublicStrapiClient } from "@/lib/strapi-api"
```

## Authentication

**`apps/ui/src/lib/strapi-api/request-auth.ts`**

### API Key Authentication

```typescript
// Read-only operations (GET, HEAD)
STRAPI_REST_READONLY_API_KEY

// Write operations (POST, PUT, DELETE)
STRAPI_REST_CUSTOM_API_KEY
```

### createStrapiAuthHeader()

Utility that selects the correct API key:

```typescript
const authHeader = await createStrapiAuthHeader({
  isReadOnly: true, // use readonly API key
})
// Returns: { Authorization: "Bearer <token>" }
```

## Proxy Route

The proxy hides sensitive information from the client.

### /api/public-proxy

**`apps/ui/src/app/api/public-proxy/[...slug]/route.ts`**

- Hides `STRAPI_URL` from client
- Injects API key into requests
- Validates endpoints against allowlist

### Endpoint Allowlist

**`request-auth.ts`**

```typescript
const ALLOWED_STRAPI_ENDPOINTS: Record<string, string[]> = {
  GET: ["api/pages", "api/footer", "api/navbar"],
  POST: ["api/subscribers"],
}
```

Requests to unlisted endpoints return 403 Forbidden.

## Fetch Methods

### fetchOne()

Fetch a single document by ID (collection types) or without ID (single types).

```typescript
// Single type (no ID)
const navbar = await PublicStrapiClient.fetchOne(
  "api::navbar.navbar",
  undefined,
  { locale, populate: { links: true } }
)

// Collection type (with ID)
const page = await PublicStrapiClient.fetchOne("api::page.page", documentId, {
  locale,
  populate: { content: true },
})
```

### fetchMany()

Fetch multiple documents with optional filters and pagination.

```typescript
const pages = await PublicStrapiClient.fetchMany("api::page.page", {
  locale,
  filters: { slug: { $startsWith: "blog" } },
  pagination: { page: 1, pageSize: 10 },
})
```

### fetchAll()

Fetch all documents, automatically handling pagination.

```typescript
const allPages = await PublicStrapiClient.fetchAll("api::page.page", {
  locale,
  fields: ["fullPath", "slug"],
})
```

Internally fetches pages of 100 items and aggregates results.

### fetchOneBySlug()

Fetch a single document by its `slug` field.

```typescript
const page = await PublicStrapiClient.fetchOneBySlug(
  "api::page.page",
  "about-us",
  { locale }
)
```

### fetchOneByFullPath()

Fetch a single document by its `fullPath` field (for hierarchical pages).

```typescript
const page = await PublicStrapiClient.fetchOneByFullPath(
  "api::page.page",
  "/services/web-development",
  {
    locale,
    populate: { seo: true },
    populateDynamicZone: { content: true },
  }
)
```

## Caching Strategy

Configured in `BaseStrapiClient.fetchAPI()`:

| Environment | Behavior                             |
| ----------- | ------------------------------------ |
| Development | `revalidate: 0` (no cache)           |
| Production  | `revalidate: 60` (60 second default) |

Override per-request:

```typescript
await PublicStrapiClient.fetchOne(uid, id, params, {
  next: { revalidate: 0 }, // disable cache
})
```

## CustomFetchOptions

```typescript
interface CustomFetchOptions {
  // Use proxy route (required for client components)
  useProxy?: boolean

  // Skip adding locale to query params
  doNotAddLocaleQueryParams?: boolean
}
```

## Usage Examples

### Server Component

```typescript
// apps/ui/src/lib/strapi-api/content/server.ts
import { PublicStrapiClient } from "@/lib/strapi-api"

export async function fetchPage(fullPath: string, locale: Locale) {
  const dm = await draftMode()

  return await PublicStrapiClient.fetchOneByFullPath(
    "api::page.page",
    fullPath,
    {
      locale,
      status: dm.isEnabled ? "draft" : "published",
      populate: { seo: true },
      populateDynamicZone: { content: true },
    }
  )
}
```

### Client Component with Proxy

```typescript
"use client"

import { PublicStrapiClient } from "@/lib/strapi-api"

async function fetchData() {
  const data = await PublicStrapiClient.fetchMany(
    "api::page.page",
    { locale: "en" },
    undefined,
    { useProxy: true } // required for client-side
  )
  return data
}
```

## Adding New Endpoints

1. Add mapping in `API_ENDPOINTS`:

```typescript
// apps/ui/src/lib/strapi-api/base.ts
export const API_ENDPOINTS: { [key in UID.ContentType]?: string } = {
  "api::page.page": "/pages",
  "api::footer.footer": "/footer",
  "api::your-new-type.your-new-type": "/your-new-types", // add here
}
```

2. Add to proxy allowlist if needed:

```typescript
// apps/ui/src/lib/strapi-api/request-auth.ts
const ALLOWED_STRAPI_ENDPOINTS = {
  GET: [
    "api/your-new-types", // add here
  ],
}
```

## Related Documentation

- [Page Builder](./page-builder.md) — how fetched content is rendered
- [Pages Hierarchy](./pages-hierarchy.md) — URL structure and fullPath generation
