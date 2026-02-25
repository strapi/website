---
name: copy-component
description: "Copy a component from strapi.io by extracting structure and computed styles via Playwright, mapping to local design tokens, and generating a full-stack component (Strapi schema + React + population config). Triggers: copy component, copy section from, replicate from strapi, clone component."
---

# Copy Component from strapi.io

Extract a section from strapi.io, map its structure and styles to local design system tokens, and generate a full-stack page builder component.

**Key principle**: Use `browser_run_code` for exact computed style extraction — never guess CSS from screenshots. Map extracted values to design tokens deterministically, not visually.

**Standardization philosophy**: The source website (strapi.io) has fragmented, inconsistent styling. The goal is NOT pixel-perfect reproduction — it's standardizing into a cohesive design system. Always snap extracted values to the nearest design token from `packages/design-system/src/theme.css`. A 1-2px difference is a source inconsistency to fix, not a feature to preserve.

## Prerequisites

- Playwright MCP tools available (`browser_run_code`, `browser_take_screenshot`, `browser_snapshot` for fallback)
- Design system tokens at `packages/design-system/src/theme.css` — **canonical source** for all standardized values. Read at workflow start.
- Existing page builder patterns in `apps/ui/src/components/page-builder/`
- `create-content-component` skill available for schema scaffolding delegation
- Read `docs/component-registry.md` at workflow start for full component inventory

**Fail-safe rule**: If Playwright browser tools are unavailable, the mega-extract (Step 1) returns empty/null data or `selector_not_found` that cannot be resolved, or token mapping (Step 2) produces zero matches, STOP immediately and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing, manual CSS estimation, or ad-hoc implementation. The value of this skill is deterministic computed-style extraction — without it, the output is unreliable and should not be produced.

## Skill Boundaries (No Duplication)

- **This skill owns**: source section targeting, structure/style extraction, token mapping, and final React implementation fidelity.
- **`/create-content-component` owns**: Strapi schema scaffolding, dynamic zone registration, population config setup, registry wiring, and type generation workflow.
- **`/seed-content` owns**: importing/seeding content entries into Strapi.

Do not duplicate full procedures from those skills in this file. Delegate to them when their scope applies, then continue this workflow.

## Inputs (Intake Contract)

Require this contract before execution:

```yaml
component_name: <kebab-case>
source_url: <https://strapi.io/...>
selector: <CSS selector for the exact section root>
prd_goal: <1-3 sentence purpose and expected outcome>
content_constraints: <explicit constraints; use "none" when empty>
reuse_mode: <strict-reuse|balanced|pixel-first>
shadcn_mode: <prefer-existing|allow-install|no-shadcn>
category: <optional; defaults to sections>
source_urls: <optional; array of {url, selector, variant_name} for multi-variant components>
```

Validation checklist:

- Required: `component_name`, `source_url`, `selector`, `prd_goal`, `content_constraints`
- `reuse_mode`: `strict-reuse` | `balanced` | `pixel-first`
- `shadcn_mode`: `prefer-existing` | `allow-install` | `no-shadcn`
- `category`: defaults to `sections`
- `source_urls`: optional array of `{url, selector, variant_name}`. When provided, visit each URL, extract styles per variant, and merge into a single component with a `variant` enumeration field. The `source_url` + `selector` serve as the primary/default variant.

Fail fast when invalid:

> "Invalid copy-component intake contract. Missing/invalid fields: <fields>. Re-send using the strict contract."

## Steps

### Step 0: Validate contract and registry freshness

1. Validate intake contract fields and enums.
2. Read `docs/component-registry.md` as primary inventory.
3. Run drift checks against repository truth:
   - Page-level UID mappings in `docs/component-registry.md` vs `apps/ui/src/components/page-builder/index.tsx`
   - Strapi UID rows vs schema files in `apps/strapi/src/components/**/**/*.json`
   - Installed shadcn list vs components present in `apps/ui/src/components/ui/`
4. If drift is detected:
   - Continue using filesystem as source of truth.
   - Append `registry-refresh-required` to manual follow-up notes.
   - Include concise drift summary in errors only when drift blocks deterministic mapping.

### Step 1: Mega-extract structure and styles

Extract structure, desktop styles, and mobile styles in a single `browser_run_code` call.

1. Read `references/extraction-scripts.js` and locate the `megaExtractTemplate` string.
2. Replace `__SOURCE_URL__` with the contract `source_url` and `__SELECTOR__` with the contract `selector`.
3. Pass the resulting code string to `browser_run_code`.
4. The template handles: navigation, overlay dismissal, scrolling, desktop structure+styles extraction (1280×900), mobile styles extraction (375×812), and viewport reset.

**Result shape:** `{ structure, desktopStyles, mobileStyles }`

**Selector failure:** If the result contains `{ error: "selector_not_found", availableSections: [...] }`:

- First attempt auto-heal: take `browser_snapshot`, match sections against `prd_goal`.
- If auto-heal fails: present the `availableSections` list and ask for a corrected selector.
- Re-run mega-extract with the corrected selector.
- Record fallback in manual follow-up notes.

**Verification screenshot:** After mega-extract succeeds, take `browser_take_screenshot` of the target element for visual reference. All CSS values come from the mega-extract, not this screenshot.

From the structure, identify:

- **Content fields**: headings (title, subtitle), body text, labels, descriptions
- **Links**: label + href + whether it's a CTA button
- **Images and icons**: full absolute `src` URL + alt text. Resolve relative URLs against the page origin. These URLs are passed to `/seed-content` for direct download — never use `browser_take_screenshot` to capture image or icon assets.
- **Lists/repeatable items**: cards, features, steps
- **Section hierarchy**: what nests inside what

**Multi-variant extraction:** When `source_urls` is provided, run the mega-extract once per variant URL/selector. Merge results into a single data set before proceeding to Step 2.

### Step 2: Map to design tokens

Map extracted computed values to Tailwind classes using the design system tokens from `packages/design-system/src/theme.css`. Read the theme file to get current token values first.

**Read `references/token-mapping.md`** for the full token mapping tables (typography, font weight, colors, spacing, border radius, layout) and the Visual Tolerance Rule. Key principles:

- **Always snap to nearest design token** — the source site has inconsistent styling. A source 14px is `text-base` (15px), a 3px radius is `rounded-strapi-sm` (4px).
- **Never use arbitrary Tailwind values** (`text-[14px]`, `rounded-[3px]`) when a token is within ±2px.
- **Existing UI components always win** — use shadcn `Button`/`Card` even if source differs by 1-2px.

#### Responsive Diffing

Compare desktop vs mobile styles from the mega-extract (Step 1). Mobile is the base (no prefix), desktop overrides use `lg:`. See `references/token-mapping.md` → "Responsive Diffing" for details.

If layouts are structurally very different (not just direction/size changes), ask the user to choose: simplify, implement both with responsive classes, or desktop-only.

### Step 3: Map elements to existing components

Read `references/component-mapping.md` for Typography variant mapping, Link/CTA/Image mapping, Shadcn pattern matching, and Composition analysis patterns.

Apply the component mapping rules from that reference:

- **Typography**: map extracted font-size to `<Typography>` variant using the size table. Decouple `tag` (semantic) from `variant` (visual) when they differ.
- **Links/CTAs**: map `<a>` elements to `<StrapiLink>`, `<StrapiLinkText>`, or `<StrapiLinkImage>` based on source styling patterns.
- **Images**: map to `<StrapiBasicImage>` or `<StrapiLinkImage>`.
- **Section wrapper**: every page-level section uses `<section>` → `<Container>` structure. Background/padding on `<section>`, not `<Container>`.
- **Shadcn patterns**: match source UI patterns to shadcn components using `shadcn_mode` from intake.
- **Composition**: detect section header pairs, card grids, icon+text lists for Strapi repeatable component modeling.

### Step 4: Reuse audit and schema plan

Before any schema edits:

1. Use the registry and drift state from Step 0. If Step 0 detected drift, use filesystem as source of truth.
2. Reuse existing utilities first (links, images, text, accordions, etc.) by consulting the registry.
3. Check whether a top-level equivalent already exists (hero, faq, carousel, pricing cards, forms, etc.).

Run duplicate checks per `create-content-component` skill Step 1 (Checks A-D). Apply `reuse_mode` policy for conflict resolution:

- `strict-reuse`: prefer reuse/extend and avoid new atoms/components unless blocked.
- `balanced`: reuse by default, create new only for clearly unique structure.
- `pixel-first`: allow localized new atoms/components when needed for fidelity.

Pass/fail handling:

- **All applicable checks pass**: component already exists; do not create duplicates.
- **Some applicable checks pass**: treat as partial implementation; repair only missing artifacts.
- **No applicable checks pass**: create a new component workflow.

If a close match exists, resolve automatically:

- Exact/compatible match: **Reuse as-is**.
- Match with missing fields: **Extend existing** additively.
- Incompatible match: **Create new** component name/category (use suffix if needed).

Only ask the user when they explicitly request manual choice.

If a new or extended schema is needed, derive a concise attribute spec from extracted content:

- Headings → `title`, `subTitle`
- Body text → `description`
- CTA links → `utilities.link` (repeatable as needed)
- Images → `utilities.basic-image` or `utilities.link-image`
- Repeated cards/items → nested repeatable component only when truly unique

### Step 5: Delegate scaffolding to `/create-content-component`

**CRITICAL — Do not bypass this delegation.** When schema work is required, invoke `/create-content-component` via the Skill tool instead of recreating those steps manually. Manual schema creation skips populate config generation and causes silent data loss in API responses. If Step 4 resolved to **Reuse as-is**, skip this step.

This step is automatic by default. Do not wait for additional user confirmation unless there is a blocking conflict that cannot be resolved deterministically.

Invoke `/create-content-component` with the component name, category, and attribute spec from Step 4. Pass reuse intent (which existing utility components must be used). The create-content-component skill handles schema creation, dynamic zone registration, populate config, and type generation.

After delegation, verify outputs exist and are coherent:

- Strapi schema file
- Dynamic zone registration (page-level only)
- Populate config entries
- `apps/ui/src/components/page-builder/index.tsx` registration (page-level only)
- Fresh `@repo/strapi-types` generation after schema changes

### Step 6: Generate React component

Create the real styled React implementation using extracted Tailwind classes from Steps 1-3. The create-content-component skill (Step 5) produces a basic scaffold — THIS step replaces it with the actual component using computed-style-derived classes. Follow patterns from existing components:

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

- Use extracted + mapped Tailwind classes from Step 2
- Render Strapi data dynamically (not hardcoded text)
- Handle optional fields with conditionals (`{component.subTitle && ...}`)
- Map over repeatable components with `key={item.id}`
- Named export + default export
- `displayName` set explicitly
- No `removeThisWhenYouNeedMe` — this is a real implementation, not a placeholder

Component usage rules (mandatory):

- **Text**: Use `<Typography>` for standalone text blocks. Use `tag` for semantic meaning and `variant` for visual size — they don't have to match. Skip Typography for inline `<span>` fragments or single-word slots. Import from `@/components/typography`.
- **Links/CTAs**: ALWAYS use `<StrapiLink>` for `utilities.link` fields, `<StrapiLinkText>` for `utilities.link-text` fields. Import from `@/components/page-builder/components/utilities/StrapiLink` and `StrapiLinkText`.
- **Images**: ALWAYS use `<StrapiBasicImage>` for `utilities.basic-image` fields. Import from `@/components/page-builder/components/utilities/StrapiBasicImage`.
- **Linked images**: ALWAYS use `<StrapiLinkImage>` for `utilities.link-image` fields. Import from `@/components/page-builder/components/utilities/StrapiLinkImage`.
- **Section wrapper**: ALWAYS wrap page-level section content in `<section>` → `<Container>`. Import Container from `@/components/elementary/Container`.
- **Section headers**: When a section has a label/title/description group at the top, ALWAYS wrap in `<SectionHeader>` → `<SectionLabel>` + `<SectionTitle>` + `<SectionDescription>`. Import from `@/components/elementary/section-header`. SectionHeader controls gap spacing and max-width — never render its children without the wrapper. CTAs or content grids go AFTER `</SectionHeader>` with `mt-8` margin, not inside it. For dark backgrounds, pass `variant="inverse"` to all children consistently.
- **Shadcn components**: Use shadcn/ui components identified in Step 3. Import from `@/components/ui/{name}`.

### Step 7: Validate registration and types

Verify that `create-content-component` (Step 5) completed successfully. Do NOT re-register here; only confirm outputs exist before running Step 8 quality gates:

1. For dynamic-zone-level components, confirm a single (non-duplicate) `ContentComponents` mapping exists for the UID in `apps/ui/src/components/page-builder/index.tsx`.
2. **CRITICAL — Populate config check**: For dynamic-zone-level components, verify `apps/strapi/src/populateDynamicZone/{category}/{name}.ts` exists on disk. Without this file the middleware silently omits nested relations from API responses. If missing, create it now.
3. Confirm `@repo/strapi-types` were generated and reflect the new schema.
4. Confirm generated types align with fields used in the React component from Step 6.

### Step 8: Quality gates

Run checks:

1. `cd apps/strapi && pnpm generate:types`
2. `cd apps/ui && pnpm typecheck`
3. Source vs local screenshot capture for the migrated section
4. Checklist pass:
   - standalone text blocks use `<Typography>` with `tag` for semantics and `variant` for visuals
   - links/images use Strapi utility wrappers from Step 6 rules
   - no duplicate UID or `ContentComponents` mapping
5. Optional when scope is broad: `pnpm lint`

If any required gate fails, do not mark migration as done. Report failing command/check and include manual follow-up.

### Step 9: Verify

1. Take a screenshot of the original section (if not already done in Step 1).
2. If the local dev server is running, navigate to a page using the component and take a screenshot for comparison.
3. Report what was created:
   - Strapi schema path
   - Population config path
   - React component path
   - Registry entry
   - Any manual follow-up needed (icons, SVGs, animations, interactive states)

### Step 9b: Review loop (up to 3 passes)

Spawn a review sub-agent via the `Task` tool. Pass it: file list, intake contract, source URL/selector, screenshot comparison from Step 9.

The sub-agent must: read all files, check token mapping fidelity (no arbitrary values where tokens fit), check component composition (Typography, StrapiLink, section→Container), check code quality (no unused imports, no placeholders, displayName set, optional fields guarded), verify registry completeness (schema, **populate config must exist**, dynamic zone, ContentComponents mapping, fresh types). Fix issues directly. Return `PASS` or `NEEDS_WORK`.

- If `NEEDS_WORK`, apply remaining fixes and start next pass.
- If `PASS`, proceed to Step 10.
- After 3 passes without `PASS`, continue but include unresolved issues in manual follow-up.

### Step 10: Report result

Report: files created/updated, components reused, any errors, and manual follow-up needed.

### Step 11: Offer content seeding

After reporting results, use `AskUserQuestion` to offer seeding:

```yaml
question: "Seed content from {source_url} into the new {component_name} component?"
options:
  - label: "Yes, seed from source page"
    description: "Auto-seed using extracted content from Step 1. No re-scraping needed."
  - label: "No, skip seeding"
    description: "Component is ready but empty. Seed manually later."
```

- **Yes**: invoke `/seed-content` with `source_url`, target component UID, and pass the extracted `structure` data from Step 1 as `preExtractedContent` so seed-content can skip re-scraping the source page.
- **No**: done. Report final summary.
- **Other** (custom input): treat as clarification — different source URL, specific locale, or custom instructions. Adjust and invoke `/seed-content` accordingly.

## Hover and Interactive States

If the source section has visible hover effects (buttons, cards), extract them:

1. Use `browser_hover` on the element.
2. Re-extract styles via `browser_evaluate`.
3. Compare with non-hover styles.
4. Map differences to Tailwind hover variants: `hover:bg-strapi-blue-700`, `hover:shadow-lg`, etc.

## Limitations

- **SVG icons**: extract source URL when available; report inlined SVGs without file reference for manual follow-up. Never screenshot-capture icons.
- **Complex animations**: read `transition`/`animation` properties but reproduction is manual. Report findings.
- **Video/embed content**: skip and report.
- **Form logic**: structure only, not validation/submission behavior.
- **JS interactivity**: tabs, accordions, modals — structure extracted but interaction logic needs manual implementation.

## Edge Cases

- **Cookie banners/modals**: handled automatically by the mega-extract template's `dismissOverlays` step.
- **Lazy-loaded images**: handled automatically by the mega-extract template's `scrollIntoViewIfNeeded` step.
- **Section not found**: the mega-extract returns `{ error: "selector_not_found", availableSections }`. Use the fallback chain described in Step 1.
- **Deeply nested components**: flatten to 2-3 levels max. Create sub-components for repeated patterns rather than deeply nesting divs.

## See Also

- `create-content-component` skill — Strapi schema + scaffold patterns
- `seed-content` skill — content entry seeding into Strapi
- `packages/design-system/src/theme.css` — design token definitions
- `docs/page-builder.md` — component architecture overview
