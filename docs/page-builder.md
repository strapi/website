# Page Builder

The page builder enables content editors to compose pages from reusable components in Strapi, which are automatically rendered by the Next.js frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Strapi CMS                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Page (api::page.page)                                               │    │
│  │  └─ content: dynamiczone                                            │    │
│  │       ├─ forms.newsletter-form                                      │    │
│  │       ├─ plans.plan-pricing-cards                                   │    │
│  │       └─ ...                                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                          documentMiddlewares/page.ts                        │
│                          (deep population rules)                            │
└────────────────────────────────────│────────────────────────────────────────┘
                                     │ REST API
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Next.js Frontend                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ StrapiPage (page.tsx)                                                │    │
│  │  └─ maps __component UID → React component                          │    │
│  │       ├─ forms.newsletter-form → StrapiNewsletterForm               │    │
│  │       ├─ plans.plan-pricing-cards → StrapiPlanPricingCards           │    │
│  │       └─ ...                                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Editor adds components to page's `content` dynamic zone in Strapi admin
2. Page is fetched via REST API with deep population (handled by middleware)
3. `StrapiPage` iterates over `content` array
4. Each item's `__component` UID is matched against `PageContentComponents` registry
5. Matching React component renders with full component data as props

## Component Registry

The mapping between Strapi component UIDs and React components is defined in:

**`apps/ui/src/components/page-builder/index.tsx`**

```typescript
export const PageContentComponents: {
  [K in UID.Component]?: React.ComponentType<any>
} = {
  // Forms
  "forms.newsletter-form": StrapiNewsletterForm,

  // Plans
  "plans.plan-comparison-table": StrapiPlanComparisonTable,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,
  // ...
}
```

Components are grouped by category (matching Strapi's component folder structure).

## Naming Conventions

| Element               | Pattern                                    | Example                                                                         |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| Strapi UID            | `category.kebab-case`                      | `forms.newsletter-form`                                                         |
| Strapi schema file    | `{name}.json`                              | `apps/strapi/src/components/forms/newsletter-form.json`                         |
| Strapi collectionName | `components_{category}_{name_underscored}` | `components_forms_newsletter_form`                                              |
| React component       | `Strapi{PascalCase}`                       | `StrapiNewsletterForm`                                                          |
| React file            | `Strapi{PascalCase}.tsx`                   | `apps/ui/src/components/page-builder/components/forms/StrapiNewsletterForm.tsx` |

## Section Layout Pattern

Every page-level section component **must** follow this two-layer structure:

```tsx
// Always: outer section holds background + vertical padding
//         inner Container constrains content width
<section className="bg-strapi-neutral-100 py-16 lg:py-24">
  <Container>
    {/* content */}
  </Container>
</section>
```

Rules:
- **`bg-*` classes always go on `<section>`**, never on `<Container>`. This ensures the background spans the full viewport width.
- **Vertical padding (`py-*`) goes on `<section>`** so spacing is consistent regardless of content width.
- **`<Container>` is never omitted** — it provides the `max-w-312 px-6` horizontal constraint.
- When there is no background color, `<section>` still wraps `<Container>` — just without `bg-*` classes.

```tsx
// No background variant
<section className="py-16 lg:py-24">
  <Container>
    {/* content */}
  </Container>
</section>

// Full-width colored background
<section className="bg-strapi-blue-800 py-16 lg:py-24">
  <Container>
    {/* content */}
  </Container>
</section>
```

## Props Typing

React components receive their data via a `component` prop, typed using the `Data.Component` utility from `@repo/strapi-types`:

```typescript
import { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

export function StrapiNewsletterForm({
  component,
}: {
  readonly component: Data.Component<"forms.newsletter-form">
}) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <h2>{component.title}</h2>
        {/* ... */}
      </Container>
    </section>
  )
}
```

The generic parameter is the Strapi component UID (e.g., `"forms.newsletter-form"`). This provides full type safety for all attributes defined in the component schema.

**After changing Strapi schemas, regenerate types:**

```bash
cd apps/strapi && pnpm generate:types
```

## Population Rules

Dynamic zone content requires explicit population of nested relations and components. This is handled automatically by a document middleware + filesystem-based populate configs.

### How it works

**`apps/strapi/src/documentMiddlewares/page.ts`** intercepts Strapi queries and, when `populateDynamicZone` is present, automatically builds the deep `populate` tree for each component in the dynamic zone.

The middleware reads populate configs from **`apps/strapi/src/populateDynamicZone/`**. The directory is scanned automatically — no manual registration needed. File path → UID mapping:

```
populateDynamicZone/
  sections/how-it-works.ts   →  "sections.how-it-works"
  forms/newsletter-form.ts   →  "forms.newsletter-form"
  utilities/link.ts          →  "utilities.link"
```

**Every new page-level component must have a populate file** at `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`. Without it, nested relations and components are silently omitted from API responses.

### Populate file patterns

**Pattern 1 — No nested relations** (component has only scalar fields like `string`, `text`, `boolean`, `enum`):

```typescript
// sections/simple-section.ts
export default true
```

**Pattern 2 — Has nested components or relations** (import shared utility configs; define inline for unique nesting):

```typescript
// sections/banner-slice.ts
import linkPopulate from "../utilities/link"

export default {
  populate: {
    ctas: linkPopulate,
  },
}
```

**Pattern 3 — Deep nesting with type safety** (add `Modules.Documents.Params.Populate.NestedParams<"uid">` for complex configs):

```typescript
// sections/how-it-works.ts
import type { Modules } from "@strapi/strapi"

export default {
  populate: {
    items: {
      populate: {
        icon: {
          populate: { media: true },
        },
      },
    },
  },
} as Modules.Documents.Params.Populate.NestedParams<"sections.how-it-works">
```

### Decision tree for a new component

1. **Inspect the Strapi schema** (`apps/strapi/src/components/{category}/{name}.json`).
2. No `component` or `relation` attributes? → `export default true`
3. Has nested components/relations? → `export default { populate: { ... } }`
   - For each nested field:
     - `utilities.basic-image` → import `basicImagePopulate from "../utilities/basic-image"`
     - `utilities.link` → import `linkPopulate from "../utilities/link"`
     - `utilities.link-decorations` → import `linkDecorationsPopulate from "../utilities/link-decorations"`
     - Repeatable component with its own nesting → define inline `{ populate: { ... } }`
     - Simple component (only scalars) → `fieldName: true`
4. Add `as Modules.Documents.Params.Populate.NestedParams<"category.name">` when the populate tree is non-trivial.

### Reusable utility configs

Shared populate configs live in `utilities/` and should always be imported rather than duplicated:

| Import | Use for |
|---|---|
| `../utilities/basic-image` | `utilities.basic-image` fields (has `media` relation) |
| `../utilities/link` | `utilities.link` fields (has `page` relation + `decorations`) |
| `../utilities/link-decorations` | `utilities.link-decorations` (has `leftIcon`, `rightIcon`) |
| `../utilities/link-image` | `utilities.link-image` (has `image` + `page`) |
| `../utilities/link-text` | `utilities.link-text` |

### Triggering the middleware

Requests must include `populateDynamicZone` parameter:

```typescript
await PublicStrapiClient.fetchOneByFullPath("api::page.page", fullPath, {
  locale,
  populate: { seo: true },
  populateDynamicZone: { content: true }, // triggers middleware
  pagination: { page: 1, pageSize: 1 },
})
```

## Page Rendering

The rendering logic lives inline in the `StrapiPage` component:

**`apps/ui/src/app/[locale]/[[...rest]]/page.tsx`**

```typescript
export default function StrapiPage(props: PageProps<"/[locale]/[[...rest]]">) {
  const params = use(props.params)
  const locale = params.locale as Locale

  const fullPath = ROOT_PAGE_PATH + (params.rest ?? []).join("/")
  const response = use(fetchPage(fullPath, locale))
  const data = response?.data

  if (data?.content == null) {
    notFound()
  }

  const { content, ...restPageData } = data

  return (
    <>
      <StrapiStructuredData structuredData={data?.seo?.structuredData} />
      <main>
        {content
          .filter((comp) => comp != null)
          .map((comp) => {
            const Component = PageContentComponents[comp.__component]

            if (Component == null) {
              console.warn(`Unknown component "${comp.__component}"`)
              return <div>Component not implemented</div>
            }

            return (
              <ErrorBoundary key={`${comp.__component}-${comp.id}`}>
                <Component
                  component={comp}
                  pageParams={params}
                  page={restPageData}
                />
              </ErrorBoundary>
            )
          })}
      </main>
    </>
  )
}
```

Each component is wrapped in an `ErrorBoundary` to prevent a single component error from breaking the entire page. Components also receive `pageParams` and `page` props in addition to the `component` data.

## Adding New Components

Use the `create-content-component` skill:

```
/create-content-component
```

Or follow these manual steps:

1. Create Strapi schema: `apps/strapi/src/components/{category}/{name}.json`
2. Register in page dynamic zone: `apps/strapi/src/api/page/content-types/page/schema.json`
3. Add population files: `apps/strapi/src/populateDynamicZone`
4. Create React component: `apps/ui/src/components/page-builder/components/{category}/Strapi{Name}.tsx`
5. Register in `PageContentComponents`: `apps/ui/src/components/page-builder/index.tsx`
6. Generate types: `cd apps/strapi && pnpm generate:types`

## Related Documentation

- [Pages Hierarchy](./pages-hierarchy.md) — URL structure and slug management
- [Strapi API Client](./strapi-api-client.md) — fetching content from Strapi
