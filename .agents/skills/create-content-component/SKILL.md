---
name: create-content-component
description: "Creates a new page builder content component for both Strapi and the Next.js frontend. Use this skill whenever the user wants to add a new section, form, or component to the page builder — including creating Strapi schemas, dynamic zone registration, populate configs, and React wrappers. Triggers: add/create page component, new page section, page builder component, add form component, new strapi schema, add content type, new section component, add dynamic zone component, create strapi component."
---

# Add Page Builder

Add a new page builder (component) to both Strapi and the Next.js frontend.

## Execution Mode (Default: Autonomous)

Complete the workflow end-to-end without waiting for user input unless the user explicitly asks for interactive mode.

Rules:

- Derive missing inputs automatically.
- Normalize malformed inputs automatically.
- Use deterministic conflict resolution (reuse, additive extend, or suffix) instead of asking.
- Never delete fields, rename fields, or change existing field types on existing components.

## Inputs (Optional)

Preferred inputs:

- **Name**: kebab-case component name (e.g. `testimonials`, `pricing-table`)
- **Category**: one of `sections`, `forms`, `plans`, `utilities`, `seo-utilities`, `elements`, `footer`, `navbar` (default: `sections`), or any custom category.
- **Attributes**: what fields the component needs (e.g. title, description, image, items list)
- **Reuse intent** (optional): which existing utility components should be reused (only relevant when invoked by `/copy-component`)

If any are missing, resolve automatically:

1. **Name derivation**:
   - Use provided `name` when available.
   - Else derive from source context (for example section heading) and convert to kebab-case.
   - Fallback: `copied-section`.
2. **Category inference**:
   - If layout is a page section, default `sections`.
   - If primarily form inputs/actions, use `forms`.
   - If generic shared primitive, use `utilities`.
   - If uncertain, default `sections`.
3. **Attribute derivation**:
   - Use caller-provided attribute spec when available.
   - Else derive from known patterns (`title`, `subTitle`, `description`, `links`, `image`, repeatable items).

## Input Normalization

Normalize instead of rejecting:

- **Name**: convert PascalCase/camelCase/spaces/underscores to kebab-case lowercase.
- **Category**: lowercase, trim spaces, replace spaces/underscores with hyphen.
- If normalized value is empty, apply fallback defaults.

### Custom Category Handling

If category doesn't exist in `apps/strapi/src/components/`, create the folder first before creating the component schema.

## Duplication and Reuse Prevention

Before proceeding:

0. **Registry fast-path**: Read `docs/component-registry.md` for the full inventory of existing Strapi components, React wrappers, and page builder mappings. This is faster than filesystem scanning and should be the primary lookup. Fall back to filesystem glob only if the registry file is missing or stale.
1. **Check for existing component**: search the registry (or `apps/strapi/src/components/`) for exact UID and similar components.
2. **Check for reusable utilities**: before creating new sub-components or nested structures, check the registry's utilities section (or scan `utilities/` and `elements/` folders) to find reusable building blocks.

### Deterministic Duplicate Policy

For intended UID `{category}.{name}`:

- If all applicable artifacts already exist:
  - schema file
  - React file
  - dynamic zone entry (page-level only)
  - page-builder registry mapping (page-level only)
  - Reuse existing component.
  - If required attributes are missing, extend additively only (add new fields; no destructive edits).
- If only some artifacts exist:
  - Repair missing artifacts only; do not duplicate existing ones.
- If UID exists but schema is materially incompatible with requested purpose:
  - Create a new name with numeric suffix (`{name}-v2`, `-v3`, ...).
- If UID does not exist:
  - Create all required artifacts.

Never ask the user to choose between reuse/new by default. Use this policy automatically.

### Reusable Components Reference

Consult `docs/component-registry.md` for the full inventory of Strapi schemas, React wrappers, and utility components. Always prefer reusing existing utilities over creating new single-use ones.

**Key rules**:

- **Links**: Always use `utilities.link` (has page relation, external URL, decorations for button styling). Never create a new "button" or "cta" component.
- **Images**: Always use `utilities.basic-image` or `utilities.link-image`. Never create a new "photo" or "icon" component for the same structure.
- **Repeatable items with just text**: Use `utilities.text` as a repeatable component. Don't create a new "step" or "bullet" component if it's just a text field.
- **Accordion/FAQ items**: Use `utilities.accordions`. Don't create a new "faq-item" component.
- **Only create new sub-components** when the structure genuinely doesn't match any existing utility (e.g. a pricing card item with plan relation, price, features — that's unique enough).

When in doubt, reuse existing utility components by default.

## Naming Convention

Given category `sections` and name `testimonials`:

- Strapi UID: `sections.testimonials`
- Strapi file: `apps/strapi/src/components/sections/testimonials.json`
- `collectionName`: `components_sections_testimonials` (format: `components_{category}_{name_underscored}`)
- React component: `StrapiTestimonials` (prefix `Strapi` + PascalCase of name)
- React file: `apps/ui/src/components/page-builder/components/sections/StrapiTestimonials.tsx`
- Populate config: `apps/strapi/src/populateDynamicZone/sections/testimonials.ts`

Given category `footer` and name `footer-cta`:

- Strapi UID: `footer.footer-cta`
- Strapi file: `apps/strapi/src/components/footer/footer-cta.json`
- React component: `StrapiFooterCta`
- React file: `apps/ui/src/components/page-builder/single-types/footer/StrapiFooterCta.tsx`
- Populate config: `apps/strapi/src/populateDynamicZone/footer/footer-cta.ts`

Given category `navigation` and name `navbar`:

- Strapi UID: `navigation.navbar`
- Strapi file: `apps/strapi/src/components/navigation/navbar.json`
- React component: `StrapiNavbar`
- React file: `apps/ui/src/components/page-builder/components/navigation/navbar/StrapiNavbar.tsx`
- Populate config: `apps/strapi/src/populateDynamicZone/navigation/navbar.ts`

## Steps

### 1. Resolve identity and run duplicate checks

Compute:

- UID: `{category}.{name}`
- Schema path: `apps/strapi/src/components/{category}/{name}.json`
- React path: see Naming Convention section for the correct path per dynamic zone type
- Populate path: `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`

Run these checks:

- **A. Schema file exists**
- **B. UID registered in the appropriate dynamic zone** (dynamic-zone-level only — see rule below)
- **C. React component file exists**
- **D. Registry mapping exists in** `apps/ui/src/components/page-builder/index.tsx` (dynamic-zone-level only)

Use this dynamic-zone-level rule to determine which dynamic zone (if any) the component belongs to:

| Dynamic zone | Schema file                                                   | Categories                                                                          |
| ------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Page**     | `apps/strapi/src/api/page/content-types/page/schema.json`     | `sections`, `forms`, `plans`                                                        |
| **Header**   | `apps/strapi/src/api/header/content-types/header/schema.json` | `navigation`                                                                        |
| **Footer**   | `apps/strapi/src/api/footer/content-types/footer/schema.json` | `footer` (top-level only, not nested sub-components like `footer.footer-cta-badge`) |

**Utility-level** (not registered in any dynamic zone): `utilities`, `elements`, `seo-utilities`, `navbar`

Decision matrix:

- all **applicable** checks true: reuse existing; only apply additive updates if attributes are missing.
- mixed applicable true/false: repair missing artifacts only.
- no applicable checks true: create new component artifacts.
- naming conflict with incompatible existing shape: create next suffix (`{name}-v2`, `-v3`, ...).

**Note**: "applicable" means checks relevant to the component's dynamic zone level. For utility-level components, checks B and D are not applicable.

### 2. Create or extend Strapi component schema

Target file: `apps/strapi/src/components/{category}/{name}.json`.

- If missing, create:

```json
{
  "collectionName": "components_{category}_{name_with_underscores}",
  "info": {
    "displayName": "{PascalCaseName}",
    "icon": "{chosen-icon}",
    "description": ""
  },
  "options": {},
  "attributes": {}
}
```

- **Icon selection**: Pick an icon that visually represents the component's purpose from `references/strapi-icons.txt`. Be creative and varied — avoid reusing the same icon across components.

- If existing, merge additively:
  - add missing attributes
  - keep existing attribute types/options
  - never delete or rename existing attributes
  - never change existing attribute types

Common attribute patterns:

- Text: `{ "type": "string" }`, `{ "type": "text" }`, `{ "type": "richtext" }`
- Required field: add `"required": true`
- Nested utility: `{ "type": "component", "repeatable": false, "component": "utilities.link" }`
- Repeatable utility: `{ "type": "component", "repeatable": true, "component": "utilities.basic-image" }`
- Enum: `{ "type": "enumeration", "enum": ["option1", "option2"] }`
- Boolean: `{ "type": "boolean", "default": false }`

### 3. Register UID in the appropriate dynamic zone

Determine which dynamic zone the component belongs to using the rule from Step 1:

| Dynamic zone | Schema file                                                   | Categories                   |
| ------------ | ------------------------------------------------------------- | ---------------------------- |
| **Page**     | `apps/strapi/src/api/page/content-types/page/schema.json`     | `sections`, `forms`, `plans` |
| **Header**   | `apps/strapi/src/api/header/content-types/header/schema.json` | `navigation`                 |
| **Footer**   | `apps/strapi/src/api/footer/content-types/footer/schema.json` | `footer` (top-level only)    |

If the component belongs to a dynamic zone:

- Edit the corresponding schema file.
- Ensure `{category}.{name}` appears exactly once in `attributes.content.components`.
- If already present, do not add duplicate entries.

If utility-level:

- Do not add to any dynamic zone.

### 4. Add or update populate config

Create `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`.

The middleware auto-discovers this file — the path maps directly to the Strapi UID (`{category}/{name}.ts` → `{category}.{name}`). No manual registration is needed. **Every dynamic-zone-level component must have this file** — without it nested relations are silently omitted from API responses. The path category must match the Strapi UID exactly (e.g. `footer/footer-cta.ts` for `footer.footer-cta`); a wrong directory produces a broken UID mapping at runtime.

#### Decision tree

Inspect the component's Strapi schema to determine what to export:

1. **No nested `component` or `relation` attributes** (only scalar fields): `export default true`

2. **Has nested components or relations** — build a `populate` object. Import shared utility configs instead of duplicating them:

```typescript
import basicImagePopulate from "../utilities/basic-image"
import linkPopulate from "../utilities/link"

export default {
  populate: {
    image: basicImagePopulate, // utilities.basic-image field
    ctas: linkPopulate, // utilities.link field
    items: true, // repeatable with only scalar fields
    // OR when items has its own nested relations:
    // items: { populate: { icon: basicImagePopulate } },
  },
}
```

3. **Deep or complex nesting** — add `import type { Modules } from "@strapi/strapi"` and cast the export `as Modules.Documents.Params.Populate.NestedParams<"{category}.{name}">` for compile-time safety.

#### Reusable utility imports

Always import from shared utility files rather than repeating inline definitions:

| File                            | Use for                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `../utilities/basic-image`      | `utilities.basic-image` (has `media`)                      |
| `../utilities/link`             | `utilities.link` (has `page`, `decorations`)               |
| `../utilities/link-decorations` | `utilities.link-decorations` (has `leftIcon`, `rightIcon`) |
| `../utilities/link-image`       | `utilities.link-image` (has `image`, `page`)               |
| `../utilities/link-text`        | `utilities.link-text`                                      |

For utility-category components, the populate file is optional but recommended when the config needs to be shared via imports by other section populate files.

### 5. Create or update React component

Target file depends on the dynamic zone type:

- **Page components** (`sections`, `forms`, `plans`): `apps/ui/src/components/page-builder/components/{category}/Strapi{PascalCaseName}.tsx`
- **Footer components**: `apps/ui/src/components/page-builder/single-types/footer/Strapi{PascalCaseName}.tsx`
- **Navigation/Header components**: `apps/ui/src/components/page-builder/components/navigation/{name}/Strapi{PascalCaseName}.tsx`

Create a compilable baseline that renders real data fields (no hardcoded placeholder text):

```tsx
import { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

export function Strapi{PascalCaseName}({
  component,
}: {
  readonly component: Data.Component<"{category}.{name}">
}) {
  return (
    <section>
      <Container className="py-8">
        {"title" in component && component.title ? (
          <h2 className="mb-4 text-3xl font-bold">{component.title}</h2>
        ) : null}
      </Container>
    </section>
  )
}

```

Rules:

- Named export only (no default export).
- Type props with `Data.Component<"{category}.{name}">`.
- Use conditionals for optional fields.
- Keep file compiling with current generated types.
- **Always** use `<section>` → `<Container>` two-layer structure. Never omit `<Container>`.
- Background color (`bg-*`) goes on `<section>`, never on `<Container>` — so the background spans full viewport width.
- Vertical padding (`py-*`) goes on `<section>`.
- See `docs/page-builder.md` "Section Layout Pattern" for canonical examples.

### 6. Register in `ContentComponents` when component belongs to a dynamic zone

Edit `apps/ui/src/components/page-builder/index.tsx`:

If the component belongs to any dynamic zone (same rule as Step 3):

1. Ensure import exists (add if missing, keep category group ordering).
2. Ensure mapping exists exactly once:

```typescript
"{category}.{name}": Strapi{PascalCaseName},
```

If utility-level:

- Do not add a `ContentComponents` mapping.
- Keep the component available for reuse by other components.

### 7. Wait for schema registration (automatic)

**This step MUST run BEFORE type generation.** `generate:types` needs Strapi running with new schemas registered to produce correct types. Running it before restart produces stale types that cause cascading typecheck failures.

Strapi dev server auto-restarts on file changes (chokidar watches `cwd`). After all schema files are written, force a reliable watcher trigger and poll for readiness:

1. **Check Strapi is alive**: run `lsof -ti:1337`. If no process is listening, Strapi has crashed — ask the user to restart it manually and wait for confirmation.
2. Run `touch apps/strapi/src/index.ts` to guarantee the file watcher fires (belt-and-suspenders — `.json` changes should trigger it too, but `touch` ensures one final event after all writes complete).
3. Wait 5 seconds for the restart cycle to begin (TS recompile + worker fork).
4. Poll `strapi_get_components` via MCP every 5s, up to 6 attempts (30s total).
5. **On each poll failure**, re-check process health (`lsof -ti:1337`). If the process died during restart (e.g. TS compile error in populate config), report the crash immediately and ask the user to fix and restart — do not keep polling a dead process.
6. Check if the newly created UID appears in the component list.
7. **Found** → proceed to Step 7b.
8. **Timeout (30s) with process still alive** → fall back to asking the user to restart Strapi manually. Wait for confirmation before proceeding.

**Never skip this step** — writing unregistered `__component` UIDs corrupts dynamic zone data.

### 7b. Generate types and run quality gates

Run **after** Strapi has restarted and registered the new schemas:

```bash
cd apps/strapi && pnpm generate:types
cd apps/ui && pnpm typecheck
```

Optional when broader changes are made:

```bash
pnpm lint
```

### 8. Update component registry

Update `docs/component-registry.md` with newly created artifacts:

1. **Strapi Components table**: Append a new row for the created Strapi schema (UID, category, display name, key attributes).
2. **Page Builder Registry table**: If the component is page-level, append the UID → React component mapping.
3. **Last updated timestamp**: Update the date in the header.

Skip silently if `docs/component-registry.md` doesn't exist.

### 9. Update component library page

Add the new component to the dev component library at `apps/ui/src/app/[locale]/dev/component-library/page.tsx`. This page shows live examples of all components for visual reference during development.

1. Read the current component library page file.
2. **Import** the new React component at the top (keep imports grouped by category — page-builder components after elementary ones).
3. **Add a TOC entry**: append `{ id: "{name}", label: "{DisplayName}" }` to the `TOC` array.
4. **Create mock data**: define a const with example field values using `as Data.Component<"{category}.{name}">` (follow the `newsletterBannerDefaultExample` pattern already in the file).
5. **Add a `<Section>` block** at the end (before the closing `</div>`):

```tsx
<Section id="{name}" title="{DisplayName}">
  <div className="space-y-6">
    <Variant label="Default">
      <Strapi{PascalCaseName} component={mockDataConst} />
    </Variant>
  </div>
</Section>
```

6. If the component has meaningful variants (e.g. with/without optional fields, different content lengths), add multiple `<Variant>` blocks with separate mock data.
7. Use the `<Placeholder>` helper for image fields.

Skip silently if the component library page file doesn't exist.

### 10. Report results

Report what was created, updated, reused, and any errors or manual follow-up needed.

## Path Resilience

If expected paths are not found, search for existing similar files before reporting an error.
Example: glob for `**/page-builder/**/Strapi*.tsx` to find component location.

## See also

- `docs/page-builder.md` — architecture overview, naming conventions, component props
