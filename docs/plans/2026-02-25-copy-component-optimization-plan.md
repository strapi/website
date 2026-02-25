# Copy-Component Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Speed up the copy-component skill by collapsing 10 Playwright MCP calls into 2, remove friction (restart prompt), streamline seeding, and fix SectionHeader documentation so the AI uses it correctly.

**Architecture:** Four independent changes to skill documentation and reference files. No application code changes — all edits are to `.agents/skills/` markdown/JS files and `docs/component-registry.md`.

**Tech Stack:** Playwright `browser_run_code`, Skill markdown files, JS extraction scripts

**Design doc:** `docs/plans/2026-02-25-copy-component-optimization-design.md`

---

### Task 1: Create mega-extract template in extraction-scripts.js

**Files:**

- Modify: `.agents/skills/copy-component/references/extraction-scripts.js`

**Step 1: Add megaExtract template**

Add a new section at the end of `extraction-scripts.js` — a ready-to-use `browser_run_code` template. The AI substitutes `__SOURCE_URL__` and `__SELECTOR__` before passing to `browser_run_code`. The template inlines `extractStructure`, `extractStyles`, and `dismissOverlays` so they execute in the page context.

Append after line 122 (after `scrollToElement`):

```js
// =============================================================================
// Mega-Extract Template — use with browser_run_code (Step 1)
// =============================================================================
// Ready-to-use Playwright snippet. Replace __SOURCE_URL__ and __SELECTOR__
// with actual values, then pass the entire string to browser_run_code.
//
// Returns: { structure, desktopStyles, mobileStyles }
// On selector failure: { error: "selector_not_found", availableSections: [...] }
//
// Usage in skill:
//   1. Read this file
//   2. Copy the megaExtractTemplate string
//   3. Replace __SOURCE_URL__ and __SELECTOR__
//   4. Pass to browser_run_code as the `code` parameter
// =============================================================================
const megaExtractTemplate = `async (page) => {
  // --- Navigate ---
  await page.goto("__SOURCE_URL__", { waitUntil: "domcontentloaded" });

  // --- Dismiss overlays ---
  await page.evaluate(() => {
    const selectors = ['[class*="cookie"]', '[class*="consent"]', '[id*="cookie"]', '[class*="banner"]'];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));
  });

  // --- Locate target element ---
  const el = page.locator("__SELECTOR__");
  const count = await el.count();

  if (count === 0) {
    const sections = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section, [role='region'], main > div"))
        .slice(0, 10)
        .map((s, i) => ({
          index: i,
          tag: s.tagName,
          id: s.id,
          classes: s.className.toString().slice(0, 80),
          textPreview: s.textContent?.trim().slice(0, 100),
        }))
    );
    return { error: "selector_not_found", availableSections: sections };
  }

  // --- Scroll into view for lazy-loaded content ---
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // --- Helper: extractStructure (inlined) ---
  function _extractStructure(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null;
    const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim() : null;
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
      children: Array.from(el.children).map(c => _extractStructure(c, depth + 1, maxDepth)).filter(Boolean),
    };
  }

  // --- Helper: extractStyles (inlined) ---
  function _extractStyles(el, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return null;
    const s = window.getComputedStyle(el);
    const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim() : null;
    return {
      tag: el.tagName.toLowerCase(),
      text,
      styles: {
        fontSize: s.fontSize, fontWeight: s.fontWeight, fontFamily: s.fontFamily,
        lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textAlign: s.textAlign,
        textTransform: s.textTransform, color: s.color,
        display: s.display, flexDirection: s.flexDirection, flexWrap: s.flexWrap,
        alignItems: s.alignItems, justifyContent: s.justifyContent, gap: s.gap,
        gridTemplateColumns: s.gridTemplateColumns,
        marginTop: s.marginTop, marginBottom: s.marginBottom,
        marginLeft: s.marginLeft, marginRight: s.marginRight,
        paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft, paddingRight: s.paddingRight,
        width: s.width, maxWidth: s.maxWidth, height: s.height, minHeight: s.minHeight,
        backgroundColor: s.backgroundColor, borderRadius: s.borderRadius,
        boxShadow: s.boxShadow, border: s.border, opacity: s.opacity,
        overflow: s.overflow, position: s.position,
        backgroundImage: s.backgroundImage, background: s.background,
        transform: s.transform, transition: s.transition,
        textDecoration: s.textDecoration, textDecorationColor: s.textDecorationColor,
        aspectRatio: s.aspectRatio, objectFit: s.objectFit, objectPosition: s.objectPosition,
      },
      children: Array.from(el.children).map(c => _extractStyles(c, depth + 1, maxDepth)).filter(Boolean),
    };
  }

  // --- Desktop extraction (structure + styles) ---
  await page.setViewportSize({ width: 1280, height: 900 });
  const desktop = await el.evaluate((el) => {
    return {
      structure: _extractStructure(el),
      styles: _extractStyles(el),
    };
  });

  // --- Mobile extraction (styles only) ---
  await page.setViewportSize({ width: 375, height: 812 });
  const mobileStyles = await el.evaluate((el) => {
    return _extractStyles(el);
  });

  // --- Reset to desktop for screenshot ---
  await page.setViewportSize({ width: 1280, height: 900 });

  return { structure: desktop.structure, desktopStyles: desktop.styles, mobileStyles };
}`
```

**Important note:** The `_extractStructure` and `_extractStyles` helpers are defined in the outer `async (page) =>` scope but called inside `el.evaluate()`. Playwright's `evaluate()` runs code in the browser context — so the helper functions must be defined **inside each `el.evaluate()` call**, not in the Playwright scope. Fix the template so each `el.evaluate()` includes the helpers inline:

```js
// --- Desktop extraction (structure + styles) ---
await page.setViewportSize({ width: 1280, height: 900 })
const desktop = await el.evaluate((el) => {
  function _extractStructure(el, depth = 0, maxDepth = 10) {
    // ... full body ...
  }
  function _extractStyles(el, depth = 0, maxDepth = 10) {
    // ... full body ...
  }
  return {
    structure: _extractStructure(el),
    styles: _extractStyles(el),
  }
})

// --- Mobile extraction (styles only) ---
await page.setViewportSize({ width: 375, height: 812 })
const mobileStyles = await el.evaluate((el) => {
  function _extractStyles(el, depth = 0, maxDepth = 10) {
    // ... full body ...
  }
  return _extractStyles(el)
})
```

The desktop `evaluate` inlines both `_extractStructure` and `_extractStyles`. The mobile `evaluate` only inlines `_extractStyles` (structure doesn't change at mobile).

**Step 2: Keep original functions**

Do NOT remove the original standalone `extractStructure`, `extractStyles`, `dismissOverlays`, `scrollToElement` functions. They remain as the canonical reference and are still used by hover state extraction (which operates on already-loaded pages).

**Step 3: Commit**

```bash
git add .agents/skills/copy-component/references/extraction-scripts.js
git commit -m "feat(copy-component): add mega-extract browser_run_code template"
```

---

### Task 2: Rewrite SKILL.md — collapse extraction steps + remove restart prompt + update seeding

**Files:**

- Modify: `.agents/skills/copy-component/SKILL.md`

This task has several edits to SKILL.md. Apply them all, then commit once.

**Step 1: Update Prerequisites**

Replace line 16:

```markdown
- Playwright MCP tools available (browser_navigate, browser_snapshot, browser_evaluate, etc.)
```

With:

```markdown
- Playwright MCP tools available (`browser_run_code`, `browser_take_screenshot`, `browser_snapshot` for fallback)
```

**Step 2: Update Fail-safe rule**

Replace the fail-safe rule (line 22):

```markdown
**Fail-safe rule**: If Playwright browser tools are unavailable, any extraction step (Steps 2-4) returns empty or null data, or token mapping (Step 6) produces zero matches, STOP immediately and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing, manual CSS estimation, or ad-hoc implementation. The value of this skill is deterministic computed-style extraction — without it, the output is unreliable and should not be produced.
```

With:

```markdown
**Fail-safe rule**: If Playwright browser tools are unavailable, the mega-extract (Step 1) returns empty/null data or `selector_not_found` that cannot be resolved, or token mapping (Step 2) produces zero matches, STOP immediately and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing, manual CSS estimation, or ad-hoc implementation. The value of this skill is deterministic computed-style extraction — without it, the output is unreliable and should not be produced.
```

**Step 3: Replace Steps 1-5 with new Step 1: Mega-Extract**

Delete old Steps 1 through 5 (lines 75-113) and replace with:

```markdown
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
```

**Step 4: Renumber remaining steps**

Old steps renumber as follows. Update all heading text and any cross-references within the file:

| Old Step                                     | New Step                                    |
| -------------------------------------------- | ------------------------------------------- |
| Step 6: Map to design tokens                 | Step 2: Map to design tokens                |
| Step 6b: Map elements to existing components | Step 3: Map elements to existing components |
| Step 7: Reuse audit and schema plan          | Step 4: Reuse audit and schema plan         |
| Step 8: Delegate scaffolding                 | Step 5: Delegate scaffolding                |
| Step 9: Generate React component             | Step 6: Generate React component            |
| Step 10: Validate registration and types     | Step 7: Validate registration and types     |
| Step 11: Quality gates                       | Step 8: Quality gates                       |
| Step 12: Verify                              | Step 9: Verify                              |
| Step 12b: Review loop                        | Step 9b: Review loop                        |
| Step 13: Report result                       | Step 10: Report result                      |
| Step 14: Offer content seeding               | Step 11: Offer content seeding              |

Also update cross-references within the file:

- Step 2 (token mapping): change "Compare desktop (Step 3) vs mobile (Step 4)" → "Compare desktop vs mobile styles from the mega-extract (Step 1)"
- Step 3 (component mapping): no step references to update
- Step 4 (reuse audit): change "Use the registry and drift state from Step 0" stays as-is
- Step 5 (delegate): change "attribute spec from Step 7" → "attribute spec from Step 4"
- Step 6 (React component): change "extracted Tailwind classes from Steps 3-6" → "extracted Tailwind classes from Steps 1-3"; change "The create-content-component skill (Step 8)" → "The create-content-component skill (Step 5)"
- Step 6: change "identified in Step 6b" → "identified in Step 3"
- Step 7 (validate): change "create-content-component (Step 8)" → "create-content-component (Step 5)"; change "React component from Step 9" → "React component from Step 6"
- Step 8 (quality gates): change "Step 9 rules" → "Step 6 rules"
- Step 9 (verify): change "Step 5" → "Step 1"
- Step 9b (review): change "screenshot comparison from Step 12" → "screenshot comparison from Step 9"
- Step 11 (seeding): change "extracted content from Step 2" → "extracted content from Step 1"

**Step 5: Remove server restart handoff from Step 5 (old Step 8)**

In the new Step 5 (Delegate scaffolding), delete the entire "CRITICAL — Server restart handoff" block (old lines 196-200):

```markdown
**CRITICAL — Server restart handoff**: If new schema files were created or the page dynamic zone was modified, the running Strapi server does not know about the new component UIDs. **Do not proceed to content seeding.** Instead:

1. Tell the user: "New Strapi schemas were created. Please restart the Strapi server to pick up the changes, then confirm."
2. Wait for user confirmation before any MCP write operations.
3. Only after confirmation, proceed with React component generation and optional seeding.
```

Remove this entirely. The Strapi dev server auto-restarts on file changes.

**Step 6: Rewrite Step 11 (old Step 14) — Smarter seeding**

Replace old Step 14 content with:

````markdown
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
````

- **Yes**: invoke `/seed-content` with `source_url`, target component UID, and pass the extracted `structure` data from Step 1 as `preExtractedContent` so seed-content can skip re-scraping the source page.
- **No**: done. Report final summary.
- **Other** (custom input): treat as clarification — different source URL, specific locale, or custom instructions. Adjust and invoke `/seed-content` accordingly.

````

**Step 7: Add SectionHeader to Step 6 (old Step 9) component usage rules**

In the new Step 6 (Generate React component), in the "Component usage rules (mandatory)" list, add after the "Section wrapper" bullet:

```markdown
- **Section headers**: When a section has a label/title/description group at the top, ALWAYS wrap in `<SectionHeader>` → `<SectionLabel>` + `<SectionTitle>` + `<SectionDescription>`. Import from `@/components/elementary/section-header`. SectionHeader controls gap spacing and max-width — never render its children without the wrapper. CTAs or content grids go AFTER `</SectionHeader>` with `mt-8` margin, not inside it. For dark backgrounds, pass `variant="inverse"` to all children consistently.
````

**Step 8: Update Edge Cases section**

Replace the cookie banners/modals edge case:

```markdown
- **Cookie banners/modals**: handled automatically by the mega-extract template's `dismissOverlays` step.
```

Replace the lazy-loaded images edge case:

```markdown
- **Lazy-loaded images**: handled automatically by the mega-extract template's `scrollIntoViewIfNeeded` step.
```

Replace the section not found edge case:

```markdown
- **Section not found**: the mega-extract returns `{ error: "selector_not_found", availableSections }`. Use the fallback chain described in Step 1.
```

**Step 9: Commit**

```bash
git add .agents/skills/copy-component/SKILL.md
git commit -m "feat(copy-component): collapse extraction to mega-extract, remove restart prompt, streamline seeding"
```

---

### Task 3: Update component-mapping.md — fix SectionHeader composition pattern

**Files:**

- Modify: `.agents/skills/copy-component/references/component-mapping.md`

**Step 1: Replace Composition Pattern #1**

Replace lines 105-115 (the entire Composition Patterns section) with:

````markdown
## Composition Patterns

Detect common composition patterns in the extracted structure:

1. **Section header**: heading + subtitle/description group at section top → ALWAYS wrap in `<SectionHeader>` from `@/components/elementary/section-header`. This controls gap spacing, max-width, and alignment. Never render SectionTitle/SectionDescription without the wrapper.

   **Correct:**

   ```tsx
   <SectionHeader layout="center" size="default">
     <SectionLabel variant="default">{component.label}</SectionLabel>
     <SectionTitle as="h2" size="default">
       {component.title}
     </SectionTitle>
     <SectionDescription variant="default">
       {component.description}
     </SectionDescription>
   </SectionHeader>
   ```
````

**Wrong — loses spacing and max-width control:**

```tsx
<SectionTitle as="h2">{component.title}</SectionTitle>
<SectionDescription>{component.description}</SectionDescription>
```

Props:

- `SectionHeader`: `size` (xs/sm/default/lg/xl), `layout` (left/center/right)
- `SectionTitle`: `as` (h1-h6, default h2), `size` (matches parent), `variant` (default/inverse/purple)
- `SectionDescription`: `variant` (default/inverse/purple)
- `SectionLabel`: `variant` (default/inverse/purple), `image` (optional utilities.basic-image icon)

For dark backgrounds, pass `variant="inverse"` to all children consistently.
CTAs or content below the header go AFTER `</SectionHeader>` with appropriate margin (`mt-8` typical), not inside it.

2. **Card grid**: 3+ items with identical structure (image + title + text + link) → model as Strapi repeatable component. Render with `.map()` in React using a local sub-component or inline JSX. Use CSS grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).

3. **Icon + text list**: multiple icon-text pairs in a column/row → model as repeatable component with `utilities.basic-image` (icon) + text field. Render with `.map()`.

These rules are deterministic. Only ask the user when the structure is genuinely ambiguous (e.g., mixed card shapes that could be one or two component types).

````

**Step 2: Commit**

```bash
git add .agents/skills/copy-component/references/component-mapping.md
git commit -m "fix(copy-component): replace Typography pair pattern with SectionHeader composition"
````

---

### Task 4: Update component-registry.md — fix elementary component props

**Files:**

- Modify: `docs/component-registry.md`

**Step 1: Fix React Elementary Components table**

In the table starting at line 75, replace the `SectionHeading` row (line 82):

```markdown
| SectionHeading | `@/components/elementary/SectionHeading` | as (h1-h6), textStyle (display/h1/h2/h3/subtitle1/subtitle2), className — defaults: as=h2, textStyle inferred from tag | Section titles; `as` sets semantics, `textStyle` sets visual size independently |
```

With:

```markdown
| SectionHeader | `@/components/elementary/section-header` | size (xs/sm/default/lg/xl), layout (left/center/right), className — defaults: size=default, layout=center | Wrapper for section header groups. Controls gap, max-width, alignment. Always wrap SectionTitle/SectionDescription/SectionLabel in this. |
| SectionTitle | `@/components/elementary/section-header` | as (h1-h6), size (xs/sm/default/lg/xl), variant (default/inverse/purple), className — defaults: as=h2, size=default, variant=default | Section titles inside SectionHeader; `as` sets semantics, `size`+`variant` set visual style independently |
```

Replace the `SectionDescription` row (line 83):

```markdown
| SectionDescription | `@/components/elementary/SectionDescription` | className + div props; renders null when children is null | Body text below a heading — applies `body-1` muted style |
```

With:

```markdown
| SectionDescription | `@/components/elementary/section-header` | variant (default/inverse/purple), className + div props; renders null when children is null | Body text below a heading inside SectionHeader — applies `body-1` muted style |
```

Replace the `SectionLabel` row (line 84):

```markdown
| SectionLabel | `@/components/elementary/SectionLabel` | as (p/span), color (purple/green), className — default: as=p, color=purple | Small eyebrow/label text above a heading |
```

With:

```markdown
| SectionLabel | `@/components/elementary/section-header` | variant (default/inverse/purple), image (optional utilities.basic-image icon), className — default: variant=default | Eyebrow/label text above heading inside SectionHeader. Optional icon via `image` prop. |
```

**Step 2: Add StrapiSectionHeader utility wrapper**

In the "Strapi Utility React Wrappers" table (after line 97), add a new row:

```markdown
| StrapiSectionHeader | `@/components/page-builder/components/utilities/StrapiSectionHeader` | `utilities.section-header` | Rendering a Strapi section-header component with label, title, description, CTAs |
```

**Step 3: Commit**

```bash
git add docs/component-registry.md
git commit -m "fix(docs): update component-registry with correct SectionHeader props and wrapper"
```

---

### Task 5: Update seed-content SKILL.md — accept pre-extracted content

**Files:**

- Modify: `.agents/skills/seed-content/SKILL.md`

**Step 1: Add preExtractedContent to Inputs**

In the Inputs section (line 19-28), add after item 6:

```markdown
7. **Pre-extracted content** (optional): structure data already extracted by `/copy-component` mega-extract. When provided, skip Step 3 (source page fetching) and use this data directly. Shape: `{ structure, desktopStyles, mobileStyles }` from the mega-extract output.
```

**Step 2: Update Step 3 to support pre-extracted data**

Replace the Step 3 heading and first line (lines 76-78):

```markdown
### Step 3: Fetch source page content

Fetch rendered page content using the best available tool in this environment:
```

With:

```markdown
### Step 3: Fetch or receive source page content

If `preExtractedContent` was provided in the inputs, use its `structure` field directly — skip fetching. The content has already been extracted by the copy-component mega-extract and contains headings, body text, links, images, lists, and section hierarchy.

Otherwise, fetch rendered page content using the best available tool in this environment:
```

**Step 3: Commit**

```bash
git add .agents/skills/seed-content/SKILL.md
git commit -m "feat(seed-content): accept pre-extracted content to skip redundant scraping"
```

---

### Task 6: Final verification

**Step 1: Review all changes**

Read each modified file end-to-end and verify:

- All step number cross-references in SKILL.md are consistent
- The mega-extract template in extraction-scripts.js is syntactically valid JS
- component-mapping.md code examples use correct component names and props
- component-registry.md table alignment is correct
- seed-content SKILL.md step numbering is still consistent

**Step 2: Run lint on changed files**

```bash
cd /Users/jsimck/Projects/notum/strapi-website && pnpm lint
```

Expected: No new errors introduced (skill/doc files are excluded from lint, but verify nothing broke).

**Step 3: Verify extraction-scripts.js syntax**

```bash
node -c .agents/skills/copy-component/references/extraction-scripts.js
```

Expected: No syntax errors.
