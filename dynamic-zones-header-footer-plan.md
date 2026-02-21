# Dynamic Zones for Header & Footer

## Context

Currently pages use a dynamic zone pattern (`content` field) with auto-populated components via document middleware, filesystem-based populate configs, and a frontend component registry. Footer is partially migrated (has dynamic zone in Strapi but uses hardcoded `__component` checks in React). Navbar is not migrated at all - it's a standalone single type with fixed fields and a 50-line manual populate tree.

**Goal**: Create a `header` single type with a `content` dynamic zone, move navbar into a component inside it, complete the footer migration, and extract a shared `DynamicZoneRenderer` so all three zones (page, header, footer) use identical rendering logic.

**User decisions**:

- Dynamic zone containers are "dumb" - stickiness/styling is per-component, not per-container
- Delete `navbar.announcement-bar` component entirely
- Unified `ContentComponents` registry for all zones
- Remove old `api::navbar.navbar` single type in same PR

---

## Phase 1: Shared Infrastructure

### 1.1 Extract `DynamicZoneRenderer`

**Create** `apps/ui/src/components/page-builder/DynamicZoneRenderer.tsx`

Generic renderer that iterates a dynamic zone array, looks up each `__component` in a registry, renders with `ErrorBoundary`. Accepts:

- `content` - the dynamic zone array
- `registry` - component map (defaults to `ContentComponents`)
- `itemClassName` - optional per-item wrapper class (pages use `mb-6 md:mb-10 lg:mb-14`, header/footer use none)
- `extraProps` - pass-through props for components (pages pass `pageParams`, `page`, `searchParams`)

Extract logic from `StrapiPageView.tsx:51-82`.

### 1.2 Rename registry

**Modify** `apps/ui/src/components/page-builder/index.tsx`

- Rename `PageContentComponents` -> `ContentComponents`

### 1.3 Refactor `StrapiPageView.tsx`

**Modify** `apps/ui/src/components/layouts/StrapiPageView.tsx`

Replace inline `.map()` loop with `<DynamicZoneRenderer>`, passing page-specific props via `extraProps`.

### 1.4 Rename middleware

**Modify** `apps/strapi/src/documentMiddlewares/page.ts`

- Rename export: `registerPopulatePageMiddleware` -> `registerDynamicZonePopulateMiddleware`
- Rename file: `page.ts` -> `dynamic-zone.ts`

**Modify** `apps/strapi/src/index.ts`

- Update import to new name/path

The middleware is already content-type agnostic (checks `populateDynamicZone` param, not UID).

---

## Phase 2: Footer Migration (complete)

### 2.1 Register footer components in unified registry

**Modify** `apps/ui/src/components/page-builder/index.tsx`

Add imports + entries:

```
"sections.footer-main": StrapiFooterMain
"sections.footer-cta": StrapiFooterCta
```

Import from existing paths: `@/components/page-builder/single-types/footer/StrapiFooterMain` and `StrapiFooterCta`.

### 2.2 Refactor `StrapiFooter.tsx`

**Modify** `apps/ui/src/components/page-builder/single-types/footer/StrapiFooter.tsx`

Replace hardcoded `__component` checks with `<DynamicZoneRenderer>`. Remove `as any` cast and the TODO comment.

```tsx
<footer>
  <DynamicZoneRenderer content={content} />
</footer>
```

---

## Phase 3: Header Backend

### 3.1 Create `navigation.navbar` component schema

**Create** `apps/strapi/src/components/navigation/navbar.json`

Same attributes as current `api::navbar.navbar` single type:

- `logoImage` (component: `utilities.link-image`)
- `navItems` (repeatable component: `navbar.nav-item`)
- `bottomLinks` (repeatable component: `utilities.link`)
- `ctaLinks` (repeatable component: `utilities.link`)

### 3.2 Create `api::header.header` single type

**Create** files:

- `apps/strapi/src/api/header/content-types/header/schema.json` - single type, no draft/publish, i18n localized, `content` dynamic zone with `["navigation.navbar"]`
- `apps/strapi/src/api/header/controllers/header.ts` - factory controller
- `apps/strapi/src/api/header/routes/header.ts` - factory router
- `apps/strapi/src/api/header/services/header.ts` - factory service

Follow exact patterns from `apps/strapi/src/api/footer/`.

### 3.3 Create populate config for navbar component

**Create** `apps/strapi/src/populateDynamicZone/navigation/navbar.ts`

Reuse existing utility populate imports (`linkPopulate`, `linkImagePopulate`, `basicImagePopulate`, `linkTextPopulate`). This replaces the 50-line manual populate in `fetchNavbar`. Populate tree:

```
logoImage: linkImagePopulate
navItems.link: { populate: { page: true } }
navItems.sections.items.icon: basicImagePopulate
navItems.sections.items.link: { populate: { page: true } }
bottomLinks: linkPopulate
ctaLinks: linkPopulate
```

Verify exact nesting against current `fetchNavbar` populate in `server.ts:111-187`.

### 3.4 Delete `navbar.announcement-bar`

**Delete** `apps/strapi/src/components/navbar/announcement-bar.json`

Remove from any schemas that reference it (check if navbar schema references it - it doesn't based on current schema).

### 3.5 Delete old navbar single type

**Delete** entire `apps/strapi/src/api/navbar/` directory (controllers, routes, services, schema).

### 3.6 Generate types

```bash
cd apps/strapi && pnpm generate:types
```

**Must happen after schema changes, before frontend work.**

---

## Phase 4: Header Frontend

### 4.1 Create `StrapiNavbarComponent`

**Create** `apps/ui/src/components/page-builder/components/navigation/StrapiNavbarComponent.tsx`

Wraps existing `DesktopNavbar` (and later `MobileNavbar`). Applies sticky behavior + Container here (not in the header container).

```tsx
export default function StrapiNavbarComponent({ component }) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white shadow-lg/8">
      <Container>
        <DesktopNavbar
          logoImage={component.logoImage}
          navItems={component.navItems}
          ctaLinks={component.ctaLinks}
          bottomLinks={component.bottomLinks}
        />
      </Container>
    </nav>
  )
}
```

Reuses `DesktopNavbar` from `apps/ui/src/components/page-builder/single-types/navbar/DesktopNavbar.tsx` as-is (already accepts individual props).

### 4.2 Register header components

**Modify** `apps/ui/src/components/page-builder/index.tsx`

```
"navigation.navbar": StrapiNavbarComponent
```

### 4.3 Create `StrapiHeader`

**Create** `apps/ui/src/components/page-builder/single-types/header/StrapiHeader.tsx`

Fetches header data, renders "dumb" container with `DynamicZoneRenderer`. No sticky, no styling on the container itself.

```tsx
export function StrapiHeader({ locale }) {
  const response = use(fetchHeader(locale))
  const content = response?.data?.content
  if (!content?.length) return null
  return <DynamicZoneRenderer content={content} />
}
```

### 4.4 Add `fetchHeader` to `server.ts`

**Modify** `apps/ui/src/lib/strapi-api/content/server.ts`

Add `fetchHeader(locale)` using `populateDynamicZone: { content: true }`. Delete `fetchNavbar` entirely.

### 4.5 Update API endpoints and proxy

**Modify** `apps/ui/src/lib/strapi-api/base.ts`

- Add `"api::header.header": "/header"` to `API_ENDPOINTS`
- Remove `"api::navbar.navbar": "/navbar"`

**Modify** `apps/ui/src/lib/strapi-api/request-auth.ts`

- Replace `"api/navbar"` with `"api/header"` in `ALLOWED_STRAPI_ENDPOINTS`

### 4.6 Update layout

**Modify** `apps/ui/src/app/[locale]/layout.tsx`

Replace `StrapiNavbar` import/usage with `StrapiHeader`. Remove `<header>` wrapper from layout - the `<nav>` tag with sticky is now inside `StrapiNavbarComponent`.

### 4.7 Clean up old navbar files

**Delete** `apps/ui/src/components/page-builder/single-types/navbar/StrapiNavbar.tsx` (the fetcher/wrapper only)

**Keep** all sub-components (reused by `StrapiNavbarComponent`):

- `DesktopNavbar.tsx`
- `DropdownNavItem.tsx`
- `DirectNavItem.tsx`
- `NavMenuSection.tsx`
- `NavMenuLink.tsx`
- `MobileNavbar.tsx`

---

## Phase 5: Verification

1. **Type check**: `pnpm typecheck` from `apps/ui`
2. **Lint**: `pnpm lint`
3. **Ask user to restart Strapi** (new schemas require restart)
4. **Verify header API**: `curl http://localhost:1337/api/header?locale=en`
5. **Seed header data**: Via Strapi admin or MCP, create header entry with `navigation.navbar` component, copy field values from old navbar
6. **Visual check**: `pnpm dev`, verify navbar renders correctly on homepage
7. **Verify footer**: Confirm footer still renders (now using `DynamicZoneRenderer`)
8. **Verify pages**: Confirm page dynamic zones still render (now using `DynamicZoneRenderer`)

---

## Phase 6: Code Review

Launch review Sonnet 4.6 sub-agents to check:

- Type safety across all new/modified files
- No broken imports after deletions
- Build, lint, prettier should pass
- Populate config matches actual schema nesting
- `DynamicZoneRenderer` handles edge cases (empty array, null items)
- No hardcoded `__component` checks remain

Iterate up to 5 times fixing review issues until clean.

---

## Files Summary

| Action | Path                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------- |
| CREATE | `apps/ui/src/components/page-builder/DynamicZoneRenderer.tsx`                                        |
| CREATE | `apps/strapi/src/components/navigation/navbar.json`                                                  |
| CREATE | `apps/strapi/src/api/header/content-types/header/schema.json`                                        |
| CREATE | `apps/strapi/src/api/header/controllers/header.ts`                                                   |
| CREATE | `apps/strapi/src/api/header/routes/header.ts`                                                        |
| CREATE | `apps/strapi/src/api/header/services/header.ts`                                                      |
| CREATE | `apps/strapi/src/populateDynamicZone/navigation/navbar.ts`                                           |
| CREATE | `apps/ui/src/components/page-builder/components/navigation/StrapiNavbarComponent.tsx`                |
| CREATE | `apps/ui/src/components/page-builder/single-types/header/StrapiHeader.tsx`                           |
| MODIFY | `apps/ui/src/components/page-builder/index.tsx` (rename registry, add footer + header entries)       |
| MODIFY | `apps/ui/src/components/layouts/StrapiPageView.tsx` (use DynamicZoneRenderer)                        |
| MODIFY | `apps/ui/src/components/page-builder/single-types/footer/StrapiFooter.tsx` (use DynamicZoneRenderer) |
| MODIFY | `apps/ui/src/lib/strapi-api/content/server.ts` (add fetchHeader, delete fetchNavbar)                 |
| MODIFY | `apps/ui/src/lib/strapi-api/base.ts` (update API_ENDPOINTS)                                          |
| MODIFY | `apps/ui/src/lib/strapi-api/request-auth.ts` (update allowlist)                                      |
| MODIFY | `apps/ui/src/app/[locale]/layout.tsx` (StrapiNavbar -> StrapiHeader)                                 |
| RENAME | `apps/strapi/src/documentMiddlewares/page.ts` -> `dynamic-zone.ts`                                   |
| MODIFY | `apps/strapi/src/index.ts` (update middleware import)                                                |
| DELETE | `apps/strapi/src/components/navbar/announcement-bar.json`                                            |
| DELETE | `apps/strapi/src/api/navbar/` (entire directory)                                                     |
| DELETE | `apps/ui/src/components/page-builder/single-types/navbar/StrapiNavbar.tsx`                           |
