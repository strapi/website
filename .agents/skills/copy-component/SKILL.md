---
name: copy-component
description: "Copy a component from strapi.io by extracting structure and computed styles via Playwright, mapping to local design tokens, and generating a full-stack component (Strapi schema + React + population config). Triggers: copy component, copy section from, replicate from strapi, clone component."
---

# Copy Component from strapi.io

Extract a section from strapi.io, map its structure and styles to local design system tokens, and generate a full-stack page builder component.

**Key principle**: Use `browser_evaluate` for exact computed style extraction — never guess CSS from screenshots. Map extracted values to design tokens deterministically, not visually.

## Prerequisites

- Playwright MCP tools available (browser_navigate, browser_snapshot, browser_evaluate, etc.)
- Design system tokens at `packages/design-system/src/theme.css`
- Existing page builder patterns in `apps/ui/src/components/page-builder/`
- `create-content-component` skill available at `.agents/skills/create-content-component/SKILL.md`

If Playwright browser tools are unavailable, stop and tell the user this skill cannot run reliably without computed-style extraction.

## Skill Boundaries (No Duplication)

- **This skill owns**: source section targeting, structure/style extraction, token mapping, and final React implementation fidelity.
- **`/create-content-component` owns**: Strapi schema scaffolding, dynamic zone registration, population config setup, registry wiring, and type generation workflow.
- **`/seed-content` owns**: importing/seeding content entries into Strapi.

Do not duplicate full procedures from those skills in this file. Delegate to them when their scope applies, then continue this workflow.

## Inputs

Ask the user for:

1. **Source URL** (required): strapi.io page URL (e.g. `https://strapi.io/pricing`)
2. **Target section** (required): natural language description (e.g. "the hero section", "pricing cards") or CSS selector (e.g. `section.hero`, `#pricing-cards`)
3. **Component name** (optional): kebab-case name for the component (e.g. `pricing-hero`). If omitted, derive from section content.
4. **Category** (optional): one of `sections`, `forms`, `plans`, `elements`, `utilities`, `seo-utilities`, `footer`, `navbar`, or a custom category (default: `sections`)

## Section Targeting (Adaptive Fallback)

Use this priority chain to find the target section:

1. **CSS selector** (if user provides one): Direct extraction from the selector.
2. **Natural language** (default): Navigate to page, take accessibility snapshot, use semantic cues (headings, landmark roles, structure) to identify candidate sections.
3. **Interactive** (fallback): If auto-detect fails, take a snapshot and ask the user directly (in chat) to pick from numbered section descriptions.

Always confirm the identified section with the user before extracting. Include a brief description of what was found (heading text, approximate content) so user can verify.

## Steps

### Step 1: Navigate and identify target section

1. Navigate to the source URL via `browser_navigate`.
2. Wait for page load, dismiss any cookie banners or modals.
3. Take an accessibility snapshot via `browser_snapshot`.
4. Identify candidate sections matching the user's description.
5. Confirm with the user directly in chat:
   - Show 2-4 candidate sections with heading text and brief content summary.
   - Let user pick the correct one or provide a CSS selector.

### Step 2: Extract structure and content

Use `browser_evaluate` to extract the DOM tree of the confirmed section:

```javascript
(element) => {
  function extractStructure(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null;

    const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim() : null;

    return {
      tag: el.tagName.toLowerCase(),
      text,
      attrs: {
        href: el.getAttribute('href'),
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role'),
        type: el.getAttribute('type'),
      },
      childCount: el.children.length,
      children: Array.from(el.children)
        .map(c => extractStructure(c, depth + 1, maxDepth))
        .filter(Boolean),
    };
  }

  return extractStructure(element);
}
```

From the structure, identify:

- **Content fields**: headings (title, subtitle), body text, labels, descriptions
- **Links**: label + href + whether it's a CTA button
- **Images**: src + alt text
- **Lists/repeatable items**: cards, features, steps
- **Section hierarchy**: what nests inside what

### Step 3: Extract computed styles (desktop)

Resize browser to **1280px** width via `browser_resize({ width: 1280, height: 900 })`.

Use `browser_evaluate` on the target section element:

```javascript
(element) => {
  function extractStyles(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null;
    const s = window.getComputedStyle(el);

    const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim() : null;

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
      },
      children: Array.from(el.children)
        .map(c => extractStyles(c, depth + 1, maxDepth))
        .filter(Boolean),
    };
  }

  return extractStyles(element);
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

Map extracted computed values to Tailwind classes using the design system tokens from `packages/design-system/src/theme.css`. Read the theme file to get current token values first; treat the static tables below as fallback guidance.

#### Token Mapping Rules

**Typography (font size → text-* class)**:

The design system remaps the standard Tailwind text scale to match Strapi's type sizes (15px base instead of 16px). Always prefer standard Tailwind classes — the `text-strapi-*` aliases exist in the theme but are redundant.

| Computed px | Token | Tailwind class |
|---|---|---|
| 11px (0.6875rem) | `--text-xs` | `text-xs` |
| 13px (0.8125rem) | `--text-sm` | `text-sm` |
| 15px (0.9375rem) | `--text-base` | `text-base` |
| 17px (1.0625rem) | `--text-lg` | `text-lg` |
| 19px (1.1875rem) | `--text-xl` | `text-xl` |
| 21px (1.3125rem) | `--text-2xl` | `text-2xl` |
| 33px (2.0625rem) | `--text-3xl` | `text-3xl` |
| 43px (2.6875rem) | `--text-4xl` | `text-4xl` |
| 53px (3.3125rem) | `--text-5xl` | `text-5xl` |

For non-exact matches, pick the nearest standard Tailwind token. Values above 53px use `text-6xl` (60px), `text-7xl` (72px), etc.

**Font weight → font-* class**:

| Computed | Tailwind class |
|---|---|
| 100 | `font-thin` |
| 200 | `font-extralight` |
| 300 | `font-light` |
| 400 | `font-normal` |
| 500 | `font-medium` |
| 600 | `font-semibold` |
| 700 | `font-bold` |
| 800 | `font-extrabold` |
| 900 | `font-black` |

**Colors (RGB → design token)**:

Convert extracted `rgb(r, g, b)` to hex. Match against Strapi color tokens in `theme.css` using closest Euclidean RGB distance. Priority order:

1. Strapi tokens (`strapi-blue-600`, `strapi-neutral-800`, etc.)
2. Shadcn semantic tokens (`primary`, `foreground`, `muted`, etc.)
3. Default Tailwind palette (`slate-500`, `blue-600`, etc.)

Common Strapi mappings:

| Hex | Token |
|---|---|
| `#ffffff` | `strapi-neutral-0` or `white` |
| `#f6f6f9` | `strapi-neutral-100` |
| `#32324d` | `strapi-neutral-800` |
| `#212134` | `strapi-neutral-900` |
| `#4945ff` | `strapi-blue-600` (primary) |
| `#635cff` | `strapi-blue-500` |

For `backgroundColor`, use `bg-{token}`. For `color`, use `text-{token}`.

If no candidate token is reasonably close, use an arbitrary value class (for example `text-[#hex]`, `bg-[#hex]`) and report it as a follow-up tokenization candidate.

**Spacing (px → spacing scale)**:

Tailwind spacing: `value / 4 = multiplier` (base `--spacing: 0.25rem`).

| Computed | Tailwind class |
|---|---|
| 0px | `0` |
| 4px | `1` |
| 8px | `2` |
| 12px | `3` |
| 16px | `4` |
| 20px | `5` |
| 24px | `6` |
| 32px | `8` |
| 40px | `10` |
| 48px | `12` |
| 64px | `16` |
| 80px | `20` |
| 96px | `24` |

For non-exact matches, use the nearest value. Apply as `p-{n}`, `m-{n}`, `gap-{n}`, `px-{n}`, `py-{n}`, etc.

**Border radius → rounded-* class**:

| Computed | Token | Tailwind class |
|---|---|---|
| 4px | `--radius-strapi-sm` | `rounded-strapi-sm` |
| 6px | `--radius-strapi-md` | `rounded-strapi-md` |
| 10px | `--radius-strapi-lg` | `rounded-strapi-lg` |
| 9999px | — | `rounded-full` |

For other values, use standard Tailwind: `rounded-sm` (2px), `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px).

**Layout → flex/grid classes**:

| Computed | Tailwind class |
|---|---|
| `display: flex` | `flex` |
| `display: grid` | `grid` |
| `flex-direction: column` | `flex-col` |
| `flex-direction: row` | `flex-row` |
| `align-items: center` | `items-center` |
| `justify-content: center` | `justify-center` |
| `justify-content: space-between` | `justify-between` |
| `flex-wrap: wrap` | `flex-wrap` |
| `text-align: center` | `text-center` |
| `text-align: left` | `text-left` |
| `overflow: hidden` | `overflow-hidden` |

#### Responsive Diffing

Compare desktop (Step 3) vs mobile (Step 4) styles for each element:

- If layout changes (e.g. `flex-direction` row→column), use responsive prefix: `flex-col lg:flex-row`
- If font-size changes, use responsive prefix: `text-lg lg:text-3xl`
- If spacing changes significantly, use responsive prefix: `py-8 lg:py-16`
- Mobile styles are the base (no prefix), desktop overrides use `lg:` prefix

**Layout diff validation**: If desktop and mobile layouts are structurally very different (not just direction/size changes), ask the user directly:

- "Simplify to closest common layout"
- "Implement both with responsive classes"
- "Desktop-only layout"

### Step 7: Reuse audit and schema plan

Before any schema edits:

1. Scan existing Strapi components in `apps/strapi/src/components/**/*.json`.
2. Scan existing React page-builder components in `apps/ui/src/components/page-builder/components/**/Strapi*.tsx`.
3. Reuse existing utilities first (links, images, text, accordions, etc.) by following the **Reusable Components Reference** in `.agents/skills/create-content-component/SKILL.md`.
4. Check whether a top-level equivalent already exists (hero, faq, carousel, pricing cards, forms, etc.).

Run explicit duplicate checks for the intended UID (`{category}.{name}`):

- **Check A (schema file):** `apps/strapi/src/components/{category}/{name}.json` exists.
- **Check B (dynamic zone, page-level only):** UID is present in `apps/strapi/src/api/page/content-types/page/schema.json` under `attributes.content.components`.
- **Check C (React file):** `apps/ui/src/components/page-builder/components/{category}/Strapi{PascalCaseName}.tsx` exists.
- **Check D (registry, page-level only):** UID mapping exists in `apps/ui/src/components/page-builder/index.tsx`.

Use the same page-level rule as `/create-content-component`:

- page-level: sections/forms/plans (and categories already used in page dynamic zone)
- utility-level: utilities/elements/seo-utilities unless explicitly requested as top-level

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
- Images → `utilities.basic-image` or `utilities.image-with-link`
- Repeated cards/items → nested repeatable component only when truly unique

### Step 8: Delegate scaffolding to `/create-content-component`

When schema work is required, invoke `/create-content-component` instead of recreating those steps here. If Step 7 resolved to **Reuse as-is**, skip this step.

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
name: <kebab-case>
category: <category>
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
```

After delegation, verify outputs exist and are coherent:

- Strapi schema file
- Dynamic zone registration (page-level only)
- Populate config entries
- `apps/ui/src/components/page-builder/index.tsx` registration (page-level only)
- Fresh `@repo/strapi-types` generation after schema changes

### Step 9: Generate React component

Create the React component at the path established in Step 8 (schema scaffolding skipped React via `skip_react_component: true`). Use extracted Tailwind classes for a real implementation. Follow patterns from existing components:

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
- Use existing utility components (`StrapiLink`, `StrapiBasicImage`, `Typography`) where appropriate
- Named export + default export
- `displayName` set explicitly
- Wrap in `<Container>` when appropriate
- No `removeThisWhenYouNeedMe` — this is a real implementation, not a placeholder

### Step 10: Validate registration and types

Verify that `create-content-component` (Step 8) completed its Steps 4-7 successfully. Do NOT re-register or re-run type generation — only confirm the outputs exist:

1. For page-level components, confirm a single (non-duplicate) `PageContentComponents` mapping exists for the UID in `apps/ui/src/components/page-builder/index.tsx`.
2. Confirm `@repo/strapi-types` were generated (check that the generated types file reflects the new schema).
3. Confirm generated types align with fields used in the React component from Step 9.

### Step 11: Quality gates

Run these checks after implementation:

1. `cd apps/strapi && pnpm generate:types`
2. `cd apps/ui && pnpm typecheck`
3. Optional when scope is broad: `pnpm lint`

If a command fails, report the failing command and concise error summary.

### Step 12: Verify

1. Take a screenshot of the original section (if not already done in Step 5).
2. If the local dev server is running, navigate to a page using the component and take a screenshot for comparison.
3. Report what was created:
   - Strapi schema path
   - Population config path
   - React component path
   - Registry entry
   - Any manual follow-up needed (icons, SVGs, animations, interactive states)

### Step 13: Return structured result

Always finish with:

```json
{
  "actions_taken": [],
  "created": [],
  "updated": [],
  "reused": [],
  "mapped": [],
  "best_effort_mapped": [],
  "skipped": [],
  "invalid": [],
  "errors": [],
  "quality_checks": [],
  "manual_steps_needed": []
}
```

## Hover and Interactive States

If the source section has visible hover effects (buttons, cards), extract them:

1. Use `browser_hover` on the element.
2. Re-extract styles via `browser_evaluate`.
3. Compare with non-hover styles.
4. Map differences to Tailwind hover variants: `hover:bg-strapi-blue-700`, `hover:shadow-lg`, etc.

## What This Skill Does NOT Handle

- **SVG icons**: Extracted as raw SVG but matching to an icon library is manual. Report which icons are needed.
- **Complex animations**: Can read `transition` and `animation` properties but reproduction is manual. Report what was found.
- **Video/embed content**: Skip and report.
- **Form logic**: Extracts structure only, not validation/submission behavior.
- **JavaScript interactivity**: Tabs, accordions, modals — structure is extracted but interaction logic needs manual implementation.

## Edge Cases

### Cookie banners / modals blocking content

Dismiss via `browser_evaluate`:

```javascript
() => {
  // Common cookie banner selectors
  const selectors = ['[class*="cookie"]', '[class*="consent"]', '[id*="cookie"]', '[class*="banner"]'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });
}
```

### Lazy-loaded images

Scroll to the section first via `browser_evaluate`:

```javascript
(element) => { element.scrollIntoView({ behavior: 'instant' }); }
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
