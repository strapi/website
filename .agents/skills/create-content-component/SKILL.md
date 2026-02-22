---
name: create-content-component
description: "Creates a new page builder content component for both Strapi and the Next.js frontend. Triggers: add/create page component, new page section, page builder component, add form component."
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

## Caller Contract (Used by `/copy-component`)

This skill must accept non-interactive handoff data and execute directly.

Expected handoff fields:

- `operation_mode`: should be `autonomous`
- `name`
- `category`
- `component_name` (optional alias for `name`)
- `source_url`
- `selector`
- `prd_goal`
- `content_constraints`
- `reuse_mode`
- `shadcn_mode`
- `acceptance_profile`
- `attributes` (normalized field spec)
- `reuse_constraints`
- `duplicate_policy`
- `detected_atoms` (array)
- `reused_atoms` (array)
- `new_atoms` (array)
- `requires_shadcn_install` (boolean)
- `shadcn_components` (array)
- `schema_changed` (boolean hint from caller; recompute before return)
- `requires_restart` (boolean hint from caller; recompute before return)
- `seed_payload_ready` (boolean hint from caller)
- `skip_react_component` (optional): when `true`, skip React component creation (Step 5) — the calling skill creates its own implementation

If these are provided, do not prompt for extra confirmation; proceed with deterministic execution.
Missing optional fields should be defaulted (empty arrays / `false`) instead of prompting.

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
    "description": ""
  },
  "options": {},
  "attributes": {}
}
```

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

The middleware auto-discovers this file from the filesystem — the file path maps directly to the Strapi UID (`{category}/{name}.ts` → `{category}.{name}`). No manual registration is needed.

**Every dynamic-zone-level component (page, header, or footer) must have this file.** Without it the middleware silently omits nested relations from API responses.

**Path must match the component's Strapi category exactly** — e.g. `footer/footer-cta.ts` for UID `footer.footer-cta`, `navigation/navbar.ts` for UID `navigation.navbar`. Placing a file in the wrong directory (e.g. `sections/footer-cta.ts`) produces a wrong UID mapping at runtime.

#### Decision tree

Inspect the component's Strapi schema to determine what to export:

1. **No nested `component` or `relation` attributes** (only scalar fields: `string`, `text`, `boolean`, `enum`):

```typescript
export default true
```

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

3. **Deep or complex nesting** — add the type annotation for compile-time safety:

```typescript
import type { Modules } from "@strapi/strapi"
import basicImagePopulate from "../utilities/basic-image"

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
} as Modules.Documents.Params.Populate.NestedParams<"{category}.{name}">
```

#### Reusable utility imports

Always import from shared utility files rather than repeating inline definitions:

| File                            | Use for                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `../utilities/basic-image`      | `utilities.basic-image` (has `media`)                      |
| `../utilities/link`             | `utilities.link` (has `page`, `decorations`)               |
| `../utilities/link-decorations` | `utilities.link-decorations` (has `leftIcon`, `rightIcon`) |
| `../utilities/link-image`       | `utilities.link-image` (has `image`, `page`)               |
| `../utilities/link-text`        | `utilities.link-text`                                      |

For utility-category components that are only ever used as nested fields (never appear directly in the page dynamic zone), the populate file is optional but recommended when you need to share the config via imports (e.g., a new `utilities.my-icon` referenced by multiple section populate files). Place it at `../utilities/my-icon.ts` and import where needed.

### 5. Create or update React component

> **Skip condition**: If caller passed `skip_react_component: true`, skip this step entirely. The calling skill will create its own React implementation.

Target file depends on the dynamic zone type:

- **Page components** (`sections`, `forms`, `plans`): `apps/ui/src/components/page-builder/components/{category}/Strapi{PascalCaseName}.tsx`
- **Footer components**: `apps/ui/src/components/page-builder/single-types/footer/Strapi{PascalCaseName}.tsx`
- **Navigation/Header components**: `apps/ui/src/components/page-builder/components/navigation/{name}/Strapi{PascalCaseName}.tsx`

Create a compilable baseline that renders real data fields (no hardcoded placeholder text and no `removeThisWhenYouNeedMe` call):

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

Strapi{PascalCaseName}.displayName = "Strapi{PascalCaseName}"

export default Strapi{PascalCaseName}
```

Rules:

- Named export + default export.
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

### 7. Generate types and run quality gates

Run:

```bash
cd apps/strapi && pnpm generate:types
cd apps/ui && pnpm typecheck
```

Optional when broader changes are made:

```bash
pnpm lint
```

### 8. Server restart notice

If new schema files were created or the page dynamic zone was modified, remind the caller (user or parent skill):

> "New Strapi schemas were created. The running server must be restarted before any content can be written via MCP. Please restart Strapi and confirm."

**Never proceed to MCP write operations (seeding content, updating pages) until the user confirms the server has been restarted.** Writing unknown `__component` UIDs corrupts dynamic zone data.

Set return flags:

- `schema_changed=true` when schema files were created/updated additively.
- `requires_restart=true` when new schema files were created or page dynamic zone changed.
- `seed_payload_ready=true` only when schema-related restart requirement is fully satisfied.

### 8b. Update component registry

Update `docs/component-registry.md` with newly created artifacts:

1. **Strapi Components table**: Append a new row for the created Strapi schema (UID, category, display name, key attributes).
2. **Page Builder Registry table**: If the component is page-level, append the UID → React component mapping.
3. **Last updated timestamp**: Update the date in the header.

Skip silently if `docs/component-registry.md` doesn't exist.

### 9. Return structured result

Always finish with:

```json
{
  "intake_contract_valid": true,
  "acceptance_profile": "balanced-default",
  "actions_taken": [],
  "created": [],
  "updated": [],
  "reused": [],
  "detected_atoms": [],
  "reused_atoms": [],
  "new_atoms": [],
  "requires_shadcn_install": false,
  "shadcn_components": [],
  "schema_changed": false,
  "requires_restart": false,
  "seed_payload_ready": false,
  "skipped": [],
  "errors": [],
  "quality_checks": [],
  "manual_steps_needed": []
}
```

## Path Resilience

If expected paths are not found, search for existing similar files before reporting an error.
Example: glob for `**/page-builder/**/Strapi*.tsx` to find component location.

## See also

- `docs/page-builder.md` — architecture overview, naming conventions, component props
