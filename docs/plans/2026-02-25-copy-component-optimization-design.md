# Copy-Component Optimization Design

## Problem

The copy-component workflow has three issues:

1. **Slow Playwright extraction** — Steps 1-5 make 10 sequential MCP round-trips against live strapi.io: navigate, dismiss overlays, snapshot, resize, extractStructure, extractStyles (desktop), resize, extractStyles (mobile), resize, screenshot. Each round-trip adds network latency.
2. **Unnecessary server restart prompt** — Step 8 blocks on user confirming Strapi restart. The server already auto-restarts; this just adds friction.
3. **Verbose seeding flow** — Step 14 asks multiple questions about seeding. Should be a single yes/no via AskUserQuestion, auto-seeding from the same source page.
4. **SectionHeader misuse** — The `component-mapping.md` reference tells AI to render section headers as `<Typography>` pairs. The project has dedicated `SectionHeader` → `SectionTitle` / `SectionDescription` / `SectionLabel` elementary components that control gap spacing, max-width, and alignment. Without `<SectionHeader>` wrapper, margins break. The component registry also has outdated props (lists `SectionHeading` with `textStyle` instead of `SectionTitle` with `size`/`variant`).

## Change 1: Mega-Extract Script

### Current: 10 sequential Playwright MCP calls

| #   | MCP Call                  | Step                      |
| --- | ------------------------- | ------------------------- |
| 1   | `browser_navigate`        | Navigate to source        |
| 2   | `browser_evaluate`        | `dismissOverlays()`       |
| 3   | `browser_snapshot`        | Accessibility snapshot    |
| 4   | `browser_resize`          | Desktop 1280x900          |
| 5   | `browser_evaluate`        | `extractStructure()`      |
| 6   | `browser_evaluate`        | `extractStyles()` desktop |
| 7   | `browser_resize`          | Mobile 375x812            |
| 8   | `browser_evaluate`        | `extractStyles()` mobile  |
| 9   | `browser_resize`          | Back to desktop           |
| 10  | `browser_take_screenshot` | Verification screenshot   |

### New: 2 Playwright MCP calls

**Call 1** — `browser_run_code` mega-extract:

```js
;async (page) => {
  // Navigate
  await page.goto(url, { waitUntil: "domcontentloaded" })

  // Dismiss overlays
  await page.evaluate(() => {
    const selectors = [
      '[class*="cookie"]',
      '[class*="consent"]',
      '[id*="cookie"]',
      '[class*="banner"]',
    ]
    selectors.forEach((sel) =>
      document.querySelectorAll(sel).forEach((el) => el.remove())
    )
  })

  // Locate target element
  const el = page.locator(selector)
  const count = await el.count()

  if (count === 0) {
    // Fallback: return available sections for manual resolution
    const sections = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("section, [role='region'], main > div")
      )
        .slice(0, 10)
        .map((s, i) => ({
          index: i,
          tag: s.tagName,
          id: s.id,
          classes: s.className.toString().slice(0, 80),
          textPreview: s.textContent?.trim().slice(0, 100),
        }))
    )
    return { error: "selector_not_found", availableSections: sections }
  }

  // Scroll into view for lazy-loaded content
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  // Desktop extraction (structure + styles in one evaluate)
  await page.setViewportSize({ width: 1280, height: 900 })
  const desktop = await el.evaluate((el) => {
    // --- extractStructure inlined ---
    function extractStructure(el, depth = 0, maxDepth = 10) {
      /* ... */
    }
    // --- extractStyles inlined ---
    function extractStyles(el, depth = 0, maxDepth = 10) {
      /* ... */
    }

    return {
      structure: extractStructure(el),
      styles: extractStyles(el),
    }
  })

  // Mobile extraction (styles only)
  await page.setViewportSize({ width: 375, height: 812 })
  const mobileStyles = await el.evaluate((el) => {
    function extractStyles(el, depth = 0, maxDepth = 10) {
      /* ... */
    }
    return extractStyles(el)
  })

  // Reset to desktop for screenshot
  await page.setViewportSize({ width: 1280, height: 900 })

  return {
    structure: desktop.structure,
    desktopStyles: desktop.styles,
    mobileStyles,
  }
}
```

**Call 2** — `browser_take_screenshot` for verification (can't avoid — separate MCP tool).

### Selector fallback

If the mega-extract returns `{ error: "selector_not_found" }`, fall back to `browser_snapshot` for accessibility tree + interactive selector resolution. This adds 1-2 extra calls only in the failure path.

### Skill instruction changes

- Old Steps 1-5 collapse into a single **"Step 1: Extract"** that reads `references/extraction-scripts.js`, builds the `browser_run_code` snippet by inlining the helper functions, and fires it.
- Step numbers shift: old Steps 6-14 become Steps 2-10.
- The extraction-scripts.js file stays as reference — the AI inlines the functions into the `browser_run_code` snippet at runtime rather than making separate `browser_evaluate` calls.

### What we lose

- `browser_snapshot` accessibility tree is no longer captured by default. It was only used for selector fallback, which now happens on the error path.
- No intermediate visibility between navigate and extraction. If the page loads incorrectly, we only find out from the extraction results, not from a snapshot.

### What we gain

- ~80% reduction in Playwright round-trips (10 → 2)
- All network-bound operations batched into a single page session
- Viewport resizing happens server-side within one execution context (no MCP overhead per resize)

## Change 2: Remove Server Restart Prompt

### Current

Step 8 (delegate to `/create-content-component`) ends with:

> "New Strapi schemas were created. Please restart the Strapi server to pick up the changes, then confirm."

Then blocks until user confirms.

### New

Remove the restart handoff entirely. The Strapi dev server watches for file changes and restarts automatically. After `/create-content-component` completes schema creation, proceed directly to React component generation.

### Files affected

- `SKILL.md` Step 8: remove the "CRITICAL — Server restart handoff" block and the 3-step wait flow.

## Change 3: Smarter Seeding Flow

### Current

Step 14 has a multi-part flow:

1. Check if schemas are new → warn about restart
2. Ask user if they want to seed
3. If yes, invoke `/seed-content` with context

### New

Replace with a single `AskUserQuestion` call:

```yaml
question: "Seed content from {source_url} into the new {component_name} component?"
options:
  - "Yes, seed from source page"
  - "No, skip seeding"
```

- **Yes**: automatically invoke `/seed-content` with the source URL + selector + extracted content from Step 1 (mega-extract already has the structure data). No need to re-scrape.
- **No**: done.
- **Other** (user types custom input): treat as clarification for a different source URL or custom instructions, then seed accordingly.

### Key change

The extracted structure from the mega-extract (Change 1) already contains all the content data (text, links, image URLs). Pass this directly to `/seed-content` instead of making it re-scrape the same page.

## Change 4: Fix SectionHeader Documentation

### Problem

The `component-mapping.md` Composition Patterns section (line 109) instructs the AI to render section headers as Typography pairs:

> heading + subtitle pair at section top → render with `<Typography tag="h2">` + `<Typography tag="p">`

This ignores the dedicated `SectionHeader` component system which controls gap spacing between children (`gap-3` to `gap-5`), max-width constraints on content (`max-w-174` / `max-w-240`), and text alignment (`left`/`center`/`right`).

The component registry (lines 82-85) also has outdated entries:

- Lists `SectionHeading` (old name) with `textStyle` prop — actual component is `SectionTitle` with `size`/`variant` props
- Lists `SectionLabel` with `as`/`color` — actual has `variant`/`image` props
- Lists `SectionDescription` with just `className` — actual has `variant` prop
- **Does not list `SectionHeader` wrapper at all**

### Fix: component-mapping.md

Replace Composition Pattern #1 with:

````markdown
1. **Section header**: heading + subtitle/description group at section top → ALWAYS wrap in
   `<SectionHeader>` from `@/components/elementary/section-header`. This controls gap spacing,
   max-width, and alignment. Never render SectionTitle/SectionDescription without the wrapper.

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

CTAs or content below the header go AFTER `</SectionHeader>` with appropriate margin
(`mt-8` typical), not inside it.

```

### Fix: component-registry.md

Update the React Elementary Components table:

| Old | New |
|-----|-----|
| `SectionHeading` with `as, textStyle` | `SectionTitle` with `as (h1-h6), size (xs/sm/default/lg/xl), variant (default/inverse/purple)` |
| `SectionLabel` with `as, color` | `SectionLabel` with `variant (default/inverse/purple), image (optional BasicImage icon)` |
| `SectionDescription` with `className` | `SectionDescription` with `variant (default/inverse/purple), className` |
| (missing) | Add `SectionHeader` with `size (xs/sm/default/lg/xl), layout (left/center/right), className` — "Wrapper for section header groups. Controls gap, max-width, alignment. Always wrap SectionTitle/SectionDescription/SectionLabel in this." |

Also add a Strapi utility wrapper entry for `StrapiSectionHeader`:

| Component | Import Path | Wraps UID | Use When |
|-----------|-------------|-----------|----------|
| StrapiSectionHeader | `page-builder/components/utilities/StrapiSectionHeader` | `utilities.section-header` | Rendering a Strapi section-header component with label, title, description, CTAs |

### Fix: SKILL.md Step 9 component usage rules

Add to the mandatory usage rules:

> **Section headers**: When a section has a label/title/description group, ALWAYS wrap in `<SectionHeader>` → `<SectionLabel>` + `<SectionTitle>` + `<SectionDescription>`. Import from `@/components/elementary/section-header`. SectionHeader controls gap spacing and max-width — never render its children without the wrapper.

## Files Affected

| File | Change |
|------|--------|
| `.agents/skills/copy-component/SKILL.md` | Collapse Steps 1-5 into mega-extract; remove restart prompt; update seeding flow; add SectionHeader to Step 9 rules; renumber steps |
| `.agents/skills/copy-component/references/extraction-scripts.js` | Add ready-to-use `megaExtract` Playwright code template with URL/selector placeholders |
| `.agents/skills/copy-component/references/component-mapping.md` | Replace Composition Pattern #1 with SectionHeader pattern + correct/incorrect examples |
| `.agents/skills/seed-content/SKILL.md` | Add optional `preExtractedContent` to intake contract; skip scraping when provided |
| `docs/component-registry.md` | Fix SectionHeader/SectionTitle/SectionLabel/SectionDescription props; add SectionHeader entry; add StrapiSectionHeader utility entry |

## Resolved Decisions

1. **Mega-extract template**: Use a ready-to-use template in `extraction-scripts.js`. The AI substitutes URL + selector and passes the code string directly to `browser_run_code`. Duplicates extractStructure/extractStyles within the template, but eliminates AI assembly time and reduces errors.
2. **Pass extracted content to seed-content**: The mega-extract already has all structure data. Pass it to `/seed-content` via an optional `preExtractedContent` field in the intake contract, avoiding a second page visit. Requires a small update to seed-content's intake to accept pre-extracted data alongside its existing URL scraping path.
```
