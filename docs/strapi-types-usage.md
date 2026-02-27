# Strapi Types

The `@repo/strapi-types` package provides auto-generated TypeScript types from Strapi schemas for type-safe content handling across the monorepo.

## Regeneration

After ANY Strapi schema change, regenerate types from the root AGENTS.md instructions.

## Package Structure

```
packages/strapi-types/
├── generated/  →  symlink to apps/strapi/types/generated/
├── index.ts
└── package.json
```

Types are generated in Strapi and symlinked to the package for monorepo-wide imports.

## Key Type Utilities

```typescript
import { Data, FindFirst, FindMany, Result, UID } from "@repo/strapi-types"
```

| Type                      | Purpose                         | Example                                                     |
| ------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `UID.ContentType`         | Union of all content type UIDs  | `"api::page.page"`                                          |
| `UID.Component`           | Union of all component UIDs     | `"forms.newsletter"`                                        |
| `Data.ContentType<"uid">` | Full content type data          | `Data.ContentType<"api::page.page">`                        |
| `Data.Component<"uid">`   | Full component data             | `Data.Component<"forms.newsletter">`                        |
| `Result<"uid", params>`   | Response shape after population | `Result<"api::page.page", { populate: { content: true } }>` |
| `FindFirst<uid>`          | Query params for single doc     | `FindFirst<"api::page.page">`                               |
| `FindMany<uid>`           | Query params for multiple docs  | `FindMany<"api::page.page">`                                |

## Usage in Page Builder Components

```typescript
import { Data } from "@repo/strapi-types"

interface StrapiNewsletterProps {
  readonly component: Data.Component<"forms.newsletter">
}

export function StrapiNewsletter({ component }: StrapiNewsletterProps) {
  // component.title, etc. are fully typed
  return (
    <section>
      <h2>{component.title}</h2>
    </section>
  )
}
```

## Usage in API Calls

```typescript
import { FindMany, Result, UID } from "@repo/strapi-types"

import { PublicStrapiClient } from "@/lib/strapi-api"

// Type-safe query params
const params: FindMany<"api::page.page"> = {
  locale: "en",
  filters: { slug: { $startsWith: "blog" } },
  populate: { content: true, seo: true },
}

// Type-safe response
const pages: Result<"api::page.page", typeof params>[] =
  await PublicStrapiClient.fetchMany("api::page.page", params)
```

## UID Unions

Use for type-safe component registries:

```typescript
import { UID } from "@repo/strapi-types"

const ContentComponents: {
  [K in UID.Component]?: React.ComponentType<any>
} = {
  "forms.newsletter": StrapiNewsletter,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,
}
```

## Handling Dynamic Zones

Dynamic zone items have a `__component` field with the UID:

```typescript
import { Data, UID } from "@repo/strapi-types"

type DynamicZoneItem = Data.Component<UID.Component> & {
  __component: UID.Component
}

function renderComponent(item: DynamicZoneItem) {
  switch (item.__component) {
    case "forms.newsletter":
      return <StrapiNewsletter component={item as Data.Component<"forms.newsletter">} />
    case "plans.plan-pricing-cards":
      return <StrapiPlanPricingCards component={item as Data.Component<"plans.plan-pricing-cards">} />
    default:
      return null
  }
}
```

## When Types Are Stale

Symptoms of forgetting to regenerate:

- TypeScript errors about missing properties
- Runtime undefined values for fields that exist in Strapi
- IDE autocomplete missing new fields

Always regenerate when:

- Adding/removing content types
- Adding/removing components
- Changing component attributes
- Changing content type attributes
- Modifying relations between types

## Related Documentation

- [Page Builder](./page-builder.md) — Component registry using these types
- [Strapi API Client](./strapi-api-client.md) — API calls with type-safe params
