---
name: copy-component
description: "Copy a component from strapi.io by extracting structure and computed styles via Playwright, mapping to local design tokens, and generating a full-stack component (Strapi schema + React + population config). Triggers: copy component, copy section from, replicate from strapi, clone component."
---

# Copy Component from strapi.io

Extract a section from strapi.io, map its structure and styles to local design system tokens, and generate a full-stack page builder component.

**Key principle**: Use `browser_evaluate` for exact computed style extraction — never guess CSS from screenshots. Map extracted values to design tokens deterministically, not visually.

**Standardization philosophy**: The source website (strapi.io) has fragmented, inconsistent styling. The goal is NOT pixel-perfect reproduction — it's standardizing into a cohesive design system. Always snap extracted values to the nearest design token from `packages/design-system/src/theme.css`. A 1-2px difference is a source inconsistency to fix, not a feature to preserve.

## Prerequisites

- Playwright MCP tools available (browser_navigate, browser_snapshot, browser_evaluate, etc.)
- Design system tokens at `packages/design-system/src/theme.css` — **canonical source** for all standardized values (Strapi colors, typography scale, border radii, shadcn semantic tokens). Read this file at workflow start and snap all extracted values to these tokens.
- Existing page builder patterns in `apps/ui/src/components/page-builder/`
- `create-content-component` skill available at `.agents/skills/create-content-component/SKILL.md`
- Read `docs/component-registry.md` at workflow start for full component inventory (Strapi schemas, React wrappers, shadcn/ui components, page builder mappings). This avoids redundant filesystem scanning and ensures awareness of all existing assets.

**Fail-safe rule**: If Playwright browser tools are unavailable, any extraction step (Steps 2-4) returns empty or null data, or token mapping (Step 6) produces zero matches, STOP immediately and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing, manual CSS estimation, or ad-hoc implementation. The value of this skill is deterministic computed-style extraction — without it, the output is unreliable and should not be produced.

## Skill Boundaries (No Duplication)

- **This skill owns**: source section targeting, structure/style extraction, token mapping, and final React implementation fidelity.
- **`/create-content-component` owns**: Strapi schema scaffolding, dynamic zone registration, population config setup, registry wiring, and type generation workflow.
- **`/seed-content` owns**: importing/seeding content entries into Strapi.

Do not duplicate full procedures from those skills in this file. Delegate to them when their scope applies, then continue this workflow.

## Inputs (Strict Intake Contract)

Require this run contract before execution:

```yaml
component_name: <kebab-case>
source_url: <https://strapi.io/...>
selector: <CSS selector for the exact section root>
prd_goal: <1-3 sentence purpose and expected outcome>
content_constraints: <explicit constraints; use "none" when empty>
reuse_mode: <strict-reuse|balanced|pixel-first>
shadcn_mode: <prefer-existing|allow-install|no-shadcn>
acceptance_profile: <balanced-default>
category: <optional; defaults to sections>
source_urls: <optional; array of {url, selector, variant_name} for multi-variant components>
```

Validation rules:

- `component_name`, `source_url`, `selector`, `prd_goal`, `content_constraints` are required.
- `reuse_mode` allowed values: `strict-reuse`, `balanced`, `pixel-first`.
- `shadcn_mode` allowed values: `prefer-existing`, `allow-install`, `no-shadcn`.
- `acceptance_profile` defaults to `balanced-default` when omitted.
- `category` defaults to `sections` when omitted.
- `source_urls` is optional. When provided, it's an array of objects with `url` (required), `selector` (required), and `variant_name` (required) fields. Each entry represents a visual variant of the same component found on a different page.
- When `source_urls` is provided, the skill must visit each URL, extract styles for each variant, and merge them into a single component with a `variant` enumeration field. The `source_url` + `selector` fields serve as the primary/default variant.

CamelCase compatibility:

- If caller sends camelCase fields, normalize before validation:
  - `componentName` -> `component_name`
  - `sourceUrl` -> `source_url`
  - `prdGoal` -> `prd_goal`
  - `contentConstraints` -> `content_constraints`
  - `reuseMode` -> `reuse_mode`
  - `shadcnMode` -> `shadcn_mode`
  - `acceptanceProfile` -> `acceptance_profile`
  - `sourceUrls` -> `source_urls`

Fail fast when invalid and do not proceed:

> "Invalid copy-component intake contract. Missing/invalid fields: <fields>. Re-send using the strict contract."

## Section Targeting (Selector-First)

Use this priority chain:

1. **Selector from contract** (required): extract directly from `selector`.
2. **Auto-heal fallback** (only when selector fails): take accessibility snapshot and infer closest semantic section using `prd_goal`.
3. **Interactive fallback** (only if both fail): present candidates and ask for a corrected selector.

If selector fallback was required, record this in final output under `manual_steps_needed`.

## Steps

### Step 0: Validate contract and registry freshness

1. Validate strict intake contract fields and enums.
2. Read `docs/component-registry.md` as primary inventory.
3. Run drift checks against repository truth:
   - Page-level UID mappings in `docs/component-registry.md` vs `apps/ui/src/components/page-builder/index.tsx`
   - Strapi UID rows vs schema files in `apps/strapi/src/components/**/**/*.json`
   - Installed shadcn list vs components present in `apps/ui/src/components/ui/`
4. If drift is detected:
   - Continue using filesystem as source of truth.
   - Append `registry-refresh-required` to `manual_steps_needed`.
   - Include concise drift summary in `errors` only when drift blocks deterministic mapping.

### Step 1: Navigate and identify target section

1. Navigate to the source URL via `browser_navigate`.
2. Wait for page load, dismiss any cookie banners or modals.
3. Take an accessibility snapshot via `browser_snapshot`.
4. Resolve target with selector from contract.
5. If selector does not resolve, run auto-heal fallback from Section Targeting.
6. Only if selector + auto-heal both fail, ask the user for a corrected selector.

### Step 2: Extract structure and content

Use `browser_evaluate` to extract the DOM tree of the confirmed section:

```javascript
;(element) => {
  function extractStructure(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null

    const text =
      el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim()
        : null

    return {
      tag: el.tagName.toLowerCase(),
      text,
      attrs: {
        href: el.getAttribute("href"),
        src: el.getAttribute("src"),
        alt: el.getAttribute("alt"),
        role: el.getAttribute("role"),
        type: el.getAttribute("type"),
      },
      childCount: el.children.length,
      children: Array.from(el.children)
        .map((c) => extractStructure(c, depth + 1, maxDepth))
        .filter(Boolean),
    }
  }

  return extractStructure(element)
}
```

From the structure, identify:

- **Content fields**: headings (title, subtitle), body text, labels, descriptions
- **Links**: label + href + whether it's a CTA button
- **Images and icons**: full absolute `src` URL + alt text. Resolve relative URLs against the page origin. These URLs are passed to `/seed-content` for direct download and upload to Strapi — never use `browser_take_screenshot` to capture image or icon assets.
- **Lists/repeatable items**: cards, features, steps
- **Section hierarchy**: what nests inside what

### Step 3: Extract computed styles (desktop)

Resize browser to **1280px** width via `browser_resize({ width: 1280, height: 900 })`.

Use `browser_evaluate` on the target section element:

```javascript
;(element) => {
  function extractStyles(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null
    const s = window.getComputedStyle(el)

    const text =
      el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim()
        : null

    return {
      tag: el.tagName.toLowerCase(),
      text,
      styles: {
        // Typography
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        textAlign: s.textAlign,
        textTransform: s.textTransform,
        color: s.color,
        // Layout
        display: s.display,
        flexDirection: s.flexDirection,
        flexWrap: s.flexWrap,
        alignItems: s.alignItems,
        justifyContent: s.justifyContent,
        gap: s.gap,
        gridTemplateColumns: s.gridTemplateColumns,
        // Spacing
        marginTop: s.marginTop,
        marginBottom: s.marginBottom,
        marginLeft: s.marginLeft,
        marginRight: s.marginRight,
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        // Sizing
        width: s.width,
        maxWidth: s.maxWidth,
        height: s.height,
        minHeight: s.minHeight,
        // Visual
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        border: s.border,
        opacity: s.opacity,
        overflow: s.overflow,
        position: s.position,
        // Background details
        backgroundImage: s.backgroundImage,
        background: s.background,
        // Transform & transitions
        transform: s.transform,
        transition: s.transition,
        // Text decoration
        textDecoration: s.textDecoration,
        textDecorationColor: s.textDecorationColor,
        // Object/aspect
        aspectRatio: s.aspectRatio,
        objectFit: s.objectFit,
        objectPosition: s.objectPosition,
      },
      children: Array.from(el.children)
        .map((c) => extractStyles(c, depth + 1, maxDepth))
        .filter(Boolean),
    }
  }

  return extractStyles(element)
}
```

### Step 4: Extract computed styles (mobile)

Resize browser to **375px** width via `browser_resize({ width: 375, height: 812 })`.

Re-run the same extraction script from Step 3 on the same target element.

### Step 5: Take verification screenshot

After extraction, take a screenshot at desktop width for visual reference:

1. `browser_resize({ width: 1280, height: 900 })`
2. `browser_take_screenshot` of the target element

This screenshot is for **verification only** — all CSS values come from `browser_evaluate`.

### Step 6: Map to design tokens

Map extracted computed values to Tailwind classes using the design system tokens from `packages/design-system/src/theme.css`. Read the theme file to get current token values first.

**Read `references/token-mapping.md`** for the full token mapping tables (typography, font weight, colors, spacing, border radius, layout) and the Visual Tolerance Rule. Key principles:

- **Always snap to nearest design token** — the source site has inconsistent styling. A source 14px is `text-base` (15px), a 3px radius is `rounded-strapi-sm` (4px).
- **Never use arbitrary Tailwind values** (`text-[14px]`, `rounded-[3px]`) when a token is within ±2px.
- **Existing UI components always win** — use shadcn `Button`/`Card` even if source differs by 1-2px.

#### Responsive Diffing

Compare desktop (Step 3) vs mobile (Step 4) styles. Mobile is the base (no prefix), desktop overrides use `lg:`. See `references/token-mapping.md` → "Responsive Diffing" for details.

If layouts are structurally very different (not just direction/size changes), ask the user to choose: simplify, implement both with responsive classes, or desktop-only.

### Step 6b: Map elements to existing components

After token mapping, map extracted HTML elements to existing React components and Strapi schemas. This ensures consistency and avoids creating redundant primitives.

**Typography mapping** — extracted font-size to `<Typography>` variant:

The project has a `Typography` component at `@/components/typography` with `typo-*` CSS classes. Map extracted sizes to variants:

| Extracted px        | Typography variant | Default tag | CSS class         |
| ------------------- | ------------------ | ----------- | ----------------- |
| >= 53px (3.3125rem) | `header1`          | `h1`        | `typo-header-1`   |
| >= 43px (2.6875rem) | `header2`          | `h2`        | `typo-header-2`   |
| >= 33px (2.0625rem) | `header3`          | `h3`        | `typo-header-3`   |
| >= 21px (1.3125rem) | `subtitle1`        | `h4`        | `typo-subtitle-1` |
| >= 19px (1.1875rem) | `subtitle2`        | `h5`        | `typo-subtitle-2` |
| >= 17px (1.0625rem) | `body1`            | `p`         | `typo-body-1`     |
| >= 15px (0.9375rem) | `body2`            | `span`      | `typo-body-2`     |
| >= 13px (0.8125rem) | `smallText1`       | `p`         | `typo-small-1`    |
| >= 11px (0.6875rem) | `smallText2`       | `p`         | `typo-small-2`    |

The "Default tag" column shows what Typography uses when no `tag` prop is passed. **Override `tag` when the semantic meaning differs from the visual size** — e.g. a price displayed large: `<Typography tag="p" variant="header3">`, a features section title displayed small: `<Typography tag="h4" variant="body2" fontWeight="medium">`.

For sizes **larger than header1** (53px): use `<Typography tag="h1" variant="header1" className="lg:text-[Xrem]">` with the exact source size as responsive override.

Typography props reference:

- `tag`: h1-h6, p, span, label (determines the HTML element — semantic meaning)
- `variant`: controls visual size independently of tag (e.g. `tag="p" variant="header3"` for a price display)
- `textColor`: black, white, primary (default), neutral, muted
- `fontWeight`: bold (default for headers), normal (default for body), semiBold, medium, etc.

Typography rules:

- Use `<Typography>` for standalone text blocks (headings, paragraphs, labels, descriptions)
- **Decouple semantics from visuals**: when the visual size doesn't match the semantic meaning, use `tag` for correct HTML semantics and `variant` for the visual style (e.g. `<Typography tag="h4" variant="body2" fontWeight="medium">` for a small section title, `<Typography tag="p" variant="header3">` for a large price display)
- Only pass `textColor`/`fontWeight` when they differ from variant defaults
- **Skip Typography** for: inline `<span>` fragments inside a Typography parent, single-word content inside another component's slot (badge, button label), or cases where raw Tailwind on a semantic tag is simpler and clearer
- Spacing/layout classes go on `className`, not as separate wrapper divs
- Import: `import { Typography } from "@/components/typography"`

**Link/CTA mapping:**

| Source Pattern                                   | Strapi Schema                                   | React Component     |
| ------------------------------------------------ | ----------------------------------------------- | ------------------- |
| `<a>` styled as button (filled bg, border, etc.) | `utilities.link` + `utilities.link-decorations` | `<StrapiLink>`      |
| `<a>` plain text (underline on hover)            | `utilities.link-text`                           | `<StrapiLinkText>`  |
| `<a>` wrapping an image                          | `utilities.link-image`                          | `<StrapiLinkImage>` |

Button variant detection from source styles: filled background → `"default"`, outline/border only → `"outline"`, text-only/underline → `"link"`, transparent bg with hover → `"ghost"`.

**Image mapping:**

| Source Pattern          | Strapi Schema           | React Component      |
| ----------------------- | ----------------------- | -------------------- |
| `<img>` in content area | `utilities.basic-image` | `<StrapiBasicImage>` |
| `<img>` inside `<a>`    | `utilities.link-image`  | `<StrapiLinkImage>`  |

**Section wrapper rule:** Every page-level section component uses `<section>` → `<Container>` structure. Import Container from `@/components/elementary/Container`. Background color (`bg-*`) and vertical padding (`py-*`) go on `<section>` — NOT on `<Container>` — so the background spans the full viewport width. `<Container>` is never omitted and never receives `bg-*` classes.

### Step 6c: Shadcn/UI pattern matching

Check `docs/component-registry.md` → "Shadcn/UI Installed" for available components. Match source UI patterns to shadcn components:

| Source Pattern                         | Shadcn Component |
| -------------------------------------- | ---------------- |
| Collapsible panels with toggle headers | `Accordion`      |
| Tab bar with switchable panels         | `Tabs`           |
| Bordered box with header/body/footer   | `Card`           |
| Horizontal scroll with arrows/dots     | `Carousel`       |
| Data rows+columns with headers         | `Table`          |
| Modal overlay on button click          | `Dialog`         |
| Floating info on hover                 | `Tooltip`        |
| Pill-shaped status indicators          | `Badge`          |
| Binary toggle                          | `Switch`         |

Policy-driven decision flow (`shadcn_mode` from intake):

1. If `shadcn_mode=no-shadcn`:
   - Do not install or introduce new shadcn components.
   - Reuse existing local primitives/wrappers.
2. If `shadcn_mode=prefer-existing`:
   - Reuse installed shadcn components when available.
   - If unavailable, prefer existing local non-shadcn primitives.
   - Do not request installs by default.
3. If `shadcn_mode=allow-install`:
   - Reuse installed shadcn first.
   - If unavailable and no equivalent local primitive exists, ask user to approve install:
     - `cd apps/ui && pnpm dlx shadcn@latest add {name}`
   - After install, update `docs/component-registry.md` "Shadcn/UI Installed" list.

Always emit a deterministic decision summary for each matched pattern:

```yaml
shadcn_decision:
  source_pattern: <pattern>
  chosen_component: <shadcn_or_local_component>
  install_needed: <true|false>
  reason: <one-line rationale>
```

### Step 6d: Composition analysis

Detect common composition patterns in the extracted structure:

1. **Section header**: heading + subtitle pair at section top → render with `<Typography tag="h2">` + `<Typography tag="p">` using appropriate variants for the extracted sizes. Use consistent spacing (`mb-4` on heading, `mb-8`–`mb-12` after subtitle). Extract a reusable atom when the same pattern appears at least 2 times in the target component or when an equivalent atom already exists.

2. **Card grid**: 3+ items with identical structure (image + title + text + link) → model as Strapi repeatable component. Render with `.map()` in React using a local sub-component or inline JSX. Use CSS grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).

3. **Icon + text list**: multiple icon-text pairs in a column/row → model as repeatable component with `utilities.basic-image` (icon) + text field. Render with `.map()`.

These rules are deterministic. Only ask the user when the structure is genuinely ambiguous (e.g., mixed card shapes that could be one or two component types).

### Step 7: Reuse audit and schema plan

Before any schema edits:

1. Use the registry and drift state from Step 0. If Step 0 detected drift, use filesystem as source of truth.
2. Reuse existing utilities first (links, images, text, accordions, etc.) by consulting the registry and the reuse rules in `.agents/skills/create-content-component/SKILL.md`.
3. Check whether a top-level equivalent already exists (hero, faq, carousel, pricing cards, forms, etc.).

Run explicit duplicate checks for the intended UID (`{category}.{name}`):

- **Check A (schema file):** `apps/strapi/src/components/{category}/{name}.json` exists.
- **Check B (dynamic zone):** UID is present in the appropriate dynamic zone schema (see table below).
- **Check C (React file):** Component file exists at the appropriate path (see `/create-content-component` naming convention).
- **Check D (registry):** UID mapping exists in `apps/ui/src/components/page-builder/index.tsx`.

Use the same dynamic-zone-level rule as `/create-content-component`:

| Dynamic zone | Schema file                                                   | Categories                   |
| ------------ | ------------------------------------------------------------- | ---------------------------- |
| **Page**     | `apps/strapi/src/api/page/content-types/page/schema.json`     | `sections`, `forms`, `plans` |
| **Header**   | `apps/strapi/src/api/header/content-types/header/schema.json` | `navigation`                 |
| **Footer**   | `apps/strapi/src/api/footer/content-types/footer/schema.json` | `footer` (top-level only)    |

**Utility-level** (not in any dynamic zone): `utilities`, `elements`, `seo-utilities`, `navbar`

Pass/fail handling:

- **All applicable checks pass**: component already exists; do not create duplicates.
- **Some applicable checks pass**: treat as partial implementation; repair only missing artifacts.
- **No applicable checks pass**: create a new component workflow.

If a close match exists, resolve automatically:

- Exact/compatible match: **Reuse as-is**.
- Match with missing fields: **Extend existing** additively.
- Incompatible match: **Create new** component name/category (use suffix if needed).

Apply `reuse_mode` policy:

- `strict-reuse`: prefer reuse/extend and avoid new atoms/components unless blocked.
- `balanced`: reuse by default, create new only for clearly unique structure.
- `pixel-first`: allow localized new atoms/components when needed for fidelity.

Only ask the user when they explicitly request manual choice.

If a new or extended schema is needed, derive a concise attribute spec from extracted content:

- Headings → `title`, `subTitle`
- Body text → `description`
- CTA links → `utilities.link` (repeatable as needed)
- Images → `utilities.basic-image` or `utilities.link-image`
- Repeated cards/items → nested repeatable component only when truly unique

### Step 8: Delegate scaffolding to `/create-content-component`

**CRITICAL — Do not bypass this delegation.** When schema work is required, invoke `/create-content-component` via the Skill tool instead of recreating those steps manually. Manual schema creation skips populate config generation and causes silent data loss in API responses. If Step 7 resolved to **Reuse as-is**, skip this step.

This step is automatic by default. Do not wait for additional user confirmation unless there is a blocking conflict that cannot be resolved deterministically.

Pass:

- Name (kebab-case)
- Category
- Attributes spec from Step 7
- Reuse intent (which existing utility components must be used)

Use this handoff contract exactly:

```yaml
operation_mode: autonomous
source_skill: copy-component
component_name: <kebab-case>
name: <kebab-case>
category: <category>
source_url: <https://strapi.io/...>
selector: <CSS selector>
prd_goal: <goal>
content_constraints: <constraints>
reuse_mode: <strict-reuse|balanced|pixel-first>
shadcn_mode: <prefer-existing|allow-install|no-shadcn>
acceptance_profile: <balanced-default>
detected_atoms: []
reused_atoms: []
new_atoms: []
requires_shadcn_install: false
shadcn_components: []
schema_changed: false
requires_restart: false
seed_payload_ready: false
attributes:
  - name: <fieldName>
    type: <strapi_type_or_component_ref>
    required: <true|false>
    repeatable: <true|false>
    notes: <mapping rationale from extracted source>
reuse_constraints:
  - Use existing utility components whenever compatible
  - Do not create duplicate UID or duplicate registry entries
skip_react_component: true
duplicate_policy:
  existing_uid: extend_additively_or_reuse
  name_collision: append_numeric_suffix
quality_gates_required:
  - generate_strapi_types
  - ui_typecheck
  - visual_diff_and_checklist
```

After delegation, verify outputs exist and are coherent:

- Strapi schema file
- Dynamic zone registration (page-level only)
- Populate config entries
- `apps/ui/src/components/page-builder/index.tsx` registration (page-level only)
- Fresh `@repo/strapi-types` generation after schema changes

**CRITICAL — Server restart handoff**: If new schema files were created or the page dynamic zone was modified, the running Strapi server does not know about the new component UIDs. **Do not proceed to content seeding.** Instead:

1. Tell the user: "New Strapi schemas were created. Please restart the Strapi server to pick up the changes, then confirm."
2. Wait for user confirmation before any MCP write operations.
3. Only after confirmation, proceed with React component generation and optional seeding.

Sending a PUT/POST with an unregistered `__component` UID can corrupt the dynamic zone or silently drop data.

### Step 9: Generate React component

Create the real styled React implementation using extracted Tailwind classes from Steps 3-6. The `skip_react_component: true` passed to create-content-component in Step 8 only tells that skill to skip its basic scaffold — THIS step produces the actual component with computed-style-derived classes. Follow patterns from existing components:

```tsx
import { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
// Import other utilities as needed (StrapiLink, StrapiBasicImage, Typography)

export function Strapi{PascalCaseName}({
  component,
}: {
  readonly component: Data.Component<"{category}.{name}">
}) {
  return (
    <section className="{extracted bg/padding classes}">
      <Container className="{extracted container classes}">
        {/* Rendered content with extracted Tailwind classes */}
      </Container>
    </section>
  )
}

Strapi{PascalCaseName}.displayName = "Strapi{PascalCaseName}"

export default Strapi{PascalCaseName}
```

Key rules:

- Use extracted + mapped Tailwind classes from Step 6
- Render Strapi data dynamically (not hardcoded text)
- Handle optional fields with conditionals (`{component.subTitle && ...}`)
- Map over repeatable components with `key={item.id}`
- Named export + default export
- `displayName` set explicitly
- No `removeThisWhenYouNeedMe` — this is a real implementation, not a placeholder

Component usage rules (mandatory):

- **Text**: Use `<Typography>` for standalone text blocks (headings, paragraphs, labels). Use `tag` for semantic meaning and `variant` for visual size — they don't have to match. Skip Typography for inline `<span>` fragments or single-word slots. Import from `@/components/typography`.
- **Links/CTAs**: ALWAYS use `<StrapiLink>` for `utilities.link` fields, `<StrapiLinkText>` for `utilities.link-text` fields. Import from `@/components/page-builder/components/utilities/StrapiLink` and `StrapiLinkText`.
- **Images**: ALWAYS use `<StrapiBasicImage>` for `utilities.basic-image` fields. Import from `@/components/page-builder/components/utilities/StrapiBasicImage`.
- **Linked images**: ALWAYS use `<StrapiLinkImage>` for `utilities.link-image` fields. Import from `@/components/page-builder/components/utilities/StrapiLinkImage`.
- **Section wrapper**: ALWAYS wrap page-level section content in `<section>` → `<Container>`. Import Container from `@/components/elementary/Container`.
- **Shadcn components**: Use shadcn/ui components identified in Step 6c. Import from `@/components/ui/{name}`.

### Step 10: Validate registration and types

Verify that `create-content-component` (Step 8) completed its Steps 4-7 successfully. Do NOT re-register here; only confirm outputs exist before running Step 11 quality gates:

1. For dynamic-zone-level components, confirm a single (non-duplicate) `ContentComponents` mapping exists for the UID in `apps/ui/src/components/page-builder/index.tsx`.
2. **CRITICAL — Populate config file-existence check**: For dynamic-zone-level components, verify that `apps/strapi/src/populateDynamicZone/{category}/{name}.ts` exists on disk. Without this file the middleware silently omits nested relations from API responses. If missing, create it now following the pattern from existing populate configs (import nested component populates and re-export as `NestedParams`).
3. Confirm `@repo/strapi-types` were generated (check that the generated types file reflects the new schema).
4. Confirm generated types align with fields used in the React component from Step 9.

### Step 11: Quality gates

Run checks based on `acceptance_profile`.

For `balanced-default` (required):

1. `cd apps/strapi && pnpm generate:types`
2. `cd apps/ui && pnpm typecheck`
3. Source vs local screenshot capture for the migrated section
4. Checklist pass:
   - standalone text blocks use `<Typography>` with `tag` for semantics and `variant` for visuals (per Step 6b rules)
   - links/images use Strapi utility wrappers from Step 9 rules
   - no duplicate UID or `ContentComponents` mapping
5. Optional when scope is broad: `pnpm lint`

If any required gate fails, do not mark migration as done. Report failing command/check and include manual follow-up.

### Step 12: Verify

1. Take a screenshot of the original section (if not already done in Step 5).
2. If the local dev server is running, navigate to a page using the component and take a screenshot for comparison.
3. Report what was created:
   - Strapi schema path
   - Population config path
   - React component path
   - Registry entry
   - Any manual follow-up needed (icons, SVGs, animations, interactive states)

### Step 12b: Review loop (up to 3 passes)

After visual verification, run an iterative review loop. The reviewer has access to both the code and the screenshot comparison from Step 12.

For each pass (max 3):

1. Spawn a review sub-agent via the `Task` tool (use model: sonnet when available). Pass it ALL of the following:
   - Full list of files created or modified in this workflow.
   - The original intake contract (`component_name`, `prd_goal`, `content_constraints`, `reuse_mode`, `acceptance_profile`).
   - The source URL and selector for reference.
   - The screenshot comparison result from Step 12 (paths to source and local screenshots, and any visual discrepancies noted).

   The sub-agent must:
   a. Read every created/modified file in full.
   b. Check token mapping fidelity — no arbitrary Tailwind values where a design token fits, no hardcoded colors/sizes that should use `theme.css` tokens.
   c. Check component composition — `<Typography>` used for standalone text, `<StrapiLink>`/`<StrapiBasicImage>`/etc. used for Strapi fields, `<section>` → `<Container>` wrapper present.
   d. Check code quality — no unused imports, no placeholder comments, no hardcoded content strings, `displayName` set, optional fields guarded with conditionals.
   e. Check registry completeness — schema file at `apps/strapi/src/components/{category}/{name}.json`, **populate config file at `apps/strapi/src/populateDynamicZone/{category}/{name}.ts`** (MUST exist for dynamic-zone-level components — without it API silently omits nested data), dynamic zone registration (page-level), `ContentComponents` mapping, `@repo/strapi-types` is fresh. Fail review if populate config is missing.
   f. Review the screenshot comparison — if visual discrepancies exist and can be fixed via Tailwind/token adjustments, fix them directly.
   g. Fix any issues it finds directly.
   h. Return a summary of what it found and what it fixed, and a `<review_status>PASS</review_status>` or `<review_status>NEEDS_WORK</review_status>` tag.

2. If the sub-agent returns `NEEDS_WORK`, apply any remaining fixes it couldn't resolve, then start the next pass.
3. If the sub-agent returns `PASS`, exit the review loop and proceed to Step 13.
4. If 3 passes complete without `PASS`, continue to Step 13 but include unresolved issues in `manual_steps_needed`.

### Step 13: Return structured result

Always finish with:

```json
{
  "intake_contract_valid": true,
  "acceptance_profile": "balanced-default",
  "registry_drift_detected": false,
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
  "mapped": [],
  "best_effort_mapped": [],
  "skipped": [],
  "invalid": [],
  "errors": [],
  "quality_checks": [],
  "manual_steps_needed": []
}
```

### Step 13b: Update component registry

Update `docs/component-registry.md` with newly created artifacts:

1. **Strapi Components table**: Append a new row for the created Strapi schema (UID, category, display name, key attributes).
2. **Page Builder Registry table**: If the component is page-level, append the UID → React component mapping.
3. **Shadcn/UI Installed list**: If any new shadcn components were installed in Step 6c, append them to the comma-separated list.
4. **Last updated timestamp**: Update the date in the header.

Skip silently if `docs/component-registry.md` doesn't exist.

### Step 14: Offer content seeding

After reporting the structured result:

1. Only offer seeding when `seed_payload_ready=true`.
2. If `requires_restart=true`, do not offer seeding until the user confirms Strapi restart.
3. Ask user if they want to seed content using `/seed-content`, including source URL and component UID for context.
4. If approved, invoke `/seed-content` with source URL, target component UID, and extracted content from Step 2.

## Hover and Interactive States

If the source section has visible hover effects (buttons, cards), extract them:

1. Use `browser_hover` on the element.
2. Re-extract styles via `browser_evaluate`.
3. Compare with non-hover styles.
4. Map differences to Tailwind hover variants: `hover:bg-strapi-blue-700`, `hover:shadow-lg`, etc.

## What This Skill Does NOT Handle

- **SVG icons**: Extract the original source URL when available (e.g. `<img src="...icon.svg">`). When the SVG is inlined in the DOM with no file reference, report which icons are needed for manual follow-up. Never use `browser_take_screenshot` to capture icons or images.
- **Complex animations**: Can read `transition` and `animation` properties but reproduction is manual. Report what was found.
- **Video/embed content**: Skip and report.
- **Form logic**: Extracts structure only, not validation/submission behavior.
- **JavaScript interactivity**: Tabs, accordions, modals — structure is extracted but interaction logic needs manual implementation.

## Edge Cases

### Cookie banners / modals blocking content

Dismiss via `browser_evaluate`:

```javascript
;() => {
  // Common cookie banner selectors
  const selectors = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[id*="cookie"]',
    '[class*="banner"]',
  ]
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove())
  })
}
```

### Lazy-loaded images

Scroll to the section first via `browser_evaluate`:

```javascript
;(element) => {
  element.scrollIntoView({ behavior: "instant" })
}
```

Then wait briefly before extracting image sources.

### Section not found

If no section matches the user's description:

1. Take a full-page screenshot.
2. Present the accessibility snapshot sections to the user.
3. Ask user to provide a CSS selector or pick from the list.

### Deeply nested components

If the section has more than 3 levels of nesting, flatten to 2-3 levels max. Create sub-components for repeated card/item patterns rather than deeply nesting divs.

## See Also

- `.agents/skills/create-content-component/SKILL.md` — Strapi schema + scaffold patterns
- `.agents/skills/seed-content/SKILL.md` — use when user also wants content entries seeded into Strapi
- `packages/design-system/src/theme.css` — design token definitions
- `docs/page-builder.md` — component architecture overview
