# Page Builder

The page builder enables content editors to compose pages from reusable components in Strapi, which are automatically rendered by the Next.js frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Strapi CMS                                     │
│  ┌──────────────────────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Page (api::page.page)        │ │ Header       │ │ Footer       │       │
│  │  └─ content: dynamiczone     │ │ (single type)│ │ (single type)│       │
│  │       ├─ sections.*          │ │  └─ content:  │ │  └─ content:  │       │
│  │       ├─ blog.*              │ │    navigation.│ │    footer.*   │       │
│  │       └─ plans.*             │ │    navbar     │ │               │       │
│  └──────────────────────────────┘ └──────────────┘ └──────────────┘       │
│                                    │                                        │
│                          documentMiddlewares (deep population rules)        │
└────────────────────────────────────│────────────────────────────────────────┘
                                     │ REST API
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Next.js Frontend                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ DynamicZoneRenderer                                                  │    │
│  │  └─ maps __component UID → React component via ContentComponents    │    │
│  │       ├─ sections.section-header → StrapiSectionHeader (Page)       │    │
│  │       ├─ footer.footer-main → StrapiFooterMain (Footer)             │    │
│  │       ├─ navigation.navbar → StrapiNavbar (Header)                  │    │
│  │       └─ ...                                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Editor adds components to a `content` dynamic zone in Strapi admin (page, header, or footer)
2. Content is fetched via REST API with deep population (handled by document middleware)
3. `DynamicZoneRenderer` iterates over the `content` array
4. Each item's `__component` UID is matched against the `ContentComponents` registry
5. Matching React component renders with full component data as props

## Component Registry

The mapping between Strapi component UIDs and React components is defined in:

**`apps/ui/src/components/page-builder/index.tsx`**

```typescript
export const ContentComponents: Partial<
  Record<UID.Component, React.ComponentType<any>>
> = {
  // Page sections/forms/plans
  "sections.section-header": StrapiSectionHeader,
  "forms.newsletter": StrapiNewsletter,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,

  // Footer
  "footer.footer-main": StrapiFooterMain,
  "footer.footer-cta": StrapiFooterCta,

  // Navigation (Header)
  "navigation.navbar": StrapiNavbar,
}
```

This single registry serves all three dynamic zones (page, header, footer). `DynamicZoneRenderer` uses it by default. Components are grouped by category.

## Naming Conventions

| Element               | Pattern                                    | Example                                                                             |
| --------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Strapi UID            | `category.kebab-case`                      | `forms.newsletter`                                                                  |
| Strapi schema file    | `{name}.json`                              | `apps/strapi/src/components/forms/newsletter.json`                                  |
| Strapi collectionName | `components_{category}_{name_underscored}` | `components_forms_newsletter`                                                       |
| React component       | `Strapi{PascalCase}`                       | `StrapiNewsletter`                                                                  |
| React file (page)     | `Strapi{PascalCase}.tsx`                   | `apps/ui/src/components/page-builder/components/forms/StrapiNewsletter.tsx`         |
| React file (footer)   | `Strapi{PascalCase}.tsx`                   | `apps/ui/src/components/page-builder/single-types/footer/StrapiFooterMain.tsx`      |
| React file (header)   | `Strapi{PascalCase}.tsx`                   | `apps/ui/src/components/page-builder/components/navigation/navbar/StrapiNavbar.tsx` |
| Populate config       | `{name}.ts`                                | `apps/strapi/src/populateDynamicZone/forms/newsletter.ts`                           |

## Section Layout Pattern

Every page-level section component **must** follow this two-layer structure:

```tsx
// Always: outer section holds background + vertical padding
//         inner Container constrains content width
<section className="bg-strapi-neutral-100 py-16 lg:py-24">
  <Container>{/* content */}</Container>
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

export function StrapiNewsletter({
  component,
}: {
  readonly component: Data.Component<"forms.newsletter">
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

The generic parameter is the Strapi component UID (e.g., `"forms.newsletter"`). This provides full type safety for all attributes defined in the component schema.

**After changing Strapi schemas, regenerate types:**

```bash
cd apps/strapi && pnpm generate:types
```

## Population Rules

Dynamic zone content requires explicit population of nested relations and components. This is handled automatically by a document middleware + filesystem-based populate configs.

### How it works

Document middlewares intercept Strapi queries and, when `populateDynamicZone` is present, automatically build the deep `populate` tree for each component in the dynamic zone. This works for all content types with dynamic zones (page, header, footer).

The middleware reads populate configs from **`apps/strapi/src/populateDynamicZone/`**. The directory is scanned automatically — no manual registration needed. File path → UID mapping:

```
populateDynamicZone/
  sections/how-it-works.ts   →  "sections.how-it-works"
  forms/newsletter.ts   →  "forms.newsletter"
  footer/footer-main.ts      →  "footer.footer-main"
  navigation/navbar.ts       →  "navigation.navbar"
  utilities/link.ts          →  "utilities.link"
```

**Every dynamic-zone-level component (page, header, or footer) must have a populate file** at `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`. The directory name must match the component's Strapi category exactly. Without it, nested relations and components are silently omitted from API responses.

### Populate file patterns

**Pattern 1 — No nested relations** (component has only scalar fields like `string`, `text`, `boolean`, `enum`):

```typescript
// sections/simple-section.ts
export default true
```

**Pattern 2 — Has nested components or relations** (import shared utility configs; define inline for unique nesting):

```typescript
// sections/section-header.ts
import basicImagePopulate from "../utilities/basic-image"
import sectionHeaderPopulate from "../utilities/section-header"

export default {
  populate: {
    section: sectionHeaderPopulate,
    sectionImage: basicImagePopulate,
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

| Import                          | Use for                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `../utilities/basic-image`      | `utilities.basic-image` fields (has `media` relation)         |
| `../utilities/link`             | `utilities.link` fields (has `page` relation + `decorations`) |
| `../utilities/link-decorations` | `utilities.link-decorations` (has `leftIcon`, `rightIcon`)    |
| `../utilities/link-image`       | `utilities.link-image` (has `image` + `page`)                 |
| `../utilities/link-text`        | `utilities.link-text`                                         |

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

## Rendering

All dynamic zones (page, header, footer) use the shared `DynamicZoneRenderer`:

**`apps/ui/src/components/page-builder/DynamicZoneRenderer.tsx`**

```typescript
export function DynamicZoneRenderer({
  content,
  registry = ContentComponents,
  itemClassName,
  extraProps,
}: DynamicZoneRendererProps) {
  return content
    .filter((comp) => comp != null)
    .map((comp) => {
      const Component = registry[comp.__component as UID.Component]
      // renders Component or warning for unknown UIDs
    })
}
```

Each component is wrapped in an `ErrorBoundary`. Usage in the three content types:

```typescript
// Page — apps/ui/src/app/[locale]/[[...rest]]/page.tsx
<main>
  <DynamicZoneRenderer content={data.content} />
</main>

// Header — apps/ui/src/components/page-builder/single-types/header/StrapiHeader.tsx
<DynamicZoneRenderer content={content} />

// Footer — apps/ui/src/components/page-builder/single-types/footer/StrapiFooter.tsx
<footer>
  <DynamicZoneRenderer content={content} />
</footer>
```

## Adding New Components

Use the `create-content-component` skill:

```
/create-content-component
```

Or follow these manual steps:

1. Create Strapi schema: `apps/strapi/src/components/{category}/{name}.json`
2. Register in appropriate dynamic zone schema (page, header, or footer)
3. Add populate config: `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`
4. Create React component (see Naming Conventions for path per dynamic zone type)
5. Register in `ContentComponents`: `apps/ui/src/components/page-builder/index.tsx`
6. Generate types: `cd apps/strapi && pnpm generate:types`

## Related Documentation

- [Pages Hierarchy](./pages-hierarchy.md) — URL structure and slug management
- [Strapi API Client](./strapi-api-client.md) — fetching content from Strapi
