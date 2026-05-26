---
name: migrate-strapi-content
description: "Batch-migrate content from the old strapi.io Strapi instance (production-old MCP) to the current production Strapi (production MCP). Fully autonomous — paste URLs and nothing else is needed. Supports ALL content types — user-stories, blog-posts, news, jobs, pages (including cross-type migrations where old use-cases/universals map to new pages), comparators. Operates MCP-to-MCP (no HTML scraping). Triggers: migrate, batch migrate, migrate from production-old, bulk seed, batch seed urls, paste urls to migrate, migrate pages, migrate solutions, migrate user stories, migrate blog posts, migrate case studies, migrate comparators."
---

# Migrate Strapi Content (batch, MCP-to-MCP)

Batch-migrate records from `production-old` (Strapi v4 at `api-prod.strapi.io`) to `production` (Strapi v5) via the Strapi MCP. Built for the common case where you paste a batch of URLs and want zero further input.

## Hard rule: NEVER ask the user anything — no exceptions

This skill runs **fully autonomous**. Do NOT use `AskUserQuestion`. Do NOT ask for approval. Do NOT ask to choose replace/append. Do NOT ask to publish. Do NOT pause before overwriting curated production content — the user has already agreed to `replace` by invoking the skill.

Apply the defaults below and report at the end. The user's input is the URL list — that is the entire contract.

If something truly cannot be decided from defaults + schema inspection (e.g. target content type unclear from URL, or target record can't be located), **skip that URL**, log it in the report under `unmatchedUrls` or per-URL `error`, and continue. Do not stop the batch to ask.

Override is possible only if the user explicitly writes `interactive` or `ask me` in the prompt — then (and only then) you may ask.

## Mapping references

**Authoritative cheatsheet**: `components-cheatsheet.csv` next to this file. One row per old slice / root field, with the v5 target, variant/layout flags, and a short `notes` field describing the field-mapping rule. Step 6 below is the code-form expansion of those rows — when CSV and Step 6 disagree, the CSV is the source of truth and Step 6 should be updated to match.

**Visual reference**: a live component library is available at **https://website-ui-omega.vercel.app/dev/component-library**. When uncertain how a v5 component renders, fetch that page (Playwright or WebFetch) and compare against the v4 source. Prefer a real v5 component over `migration.data-sink`.

## Default mapping heuristic (use this as your mental model)

Most of the content in old slices falls into a handful of shapes. Before checking the detailed table, ask which of these the old slice renders as:

1. **Columns / grid of cards (each with title + description)** → `sections.feature-card-grid`
   - Use when the slice has a repeatable `cards[]`, `features[]`, `items[]`, or `integrations[]` array of tiles.
   - The optional `section` field (utilities.section-header) carries the heading + description above the grid.
2. **Single boxed content block (title + description + optional CTA + optional image position)** → `cards.feature-card`
   - Use when the slice is a standalone content panel with one title and one body of text.
   - Examples: `slices.section-with-image`, `slices.text-next-to-image`, `slices.simple-text-next-to-image`, `slices.text-next-to-big-image`, `slices.text-with-image-and-gradient`.
3. **Multi-column feature list with a shared heading (smaller text-only tiles, not full cards)** → `sections.two-column-grid`
   - Use when items are short title+description pairs tightly grouped under one heading — no images, no CTAs.
   - Items are `elements.how-it-works-item` (title + description). The grid's `section` field is REQUIRED — always populate it from the slice's intro/title.
4. **Self-contained heading / section separator** → `sections.section-header`
   - Use for standalone label+title+description blocks that introduce a section but don't contain items.
   - Background/boxed variants live here too (e.g. interview's "dark + boxed" wrapper).
5. **Paragraphs of markdown text** → `sections.richtext`
6. **Hero at the top of a page** → `sections.hero` (slices OR root-level fields like `useCaseHero`, `homeHero`, `whiteHero`, `careersHero`, `featuresHero`, `communityHero` — all PREPENDED to newContent)
7. **CTA banner with title/text/button** → `sections.cta-banner` (background=dark|dark-inverse; the only "light" variant is achieved via `sections.section-header` with background=light instead)
8. **Quote** → `testimonials.quote`
9. **Reference to a case study** → `cards.case-study-card` (with target lookup for `companyName`/`title`)
10. **Logo / brand grid** → `media.brand-logo-grid` (logos are uploaded from old CDN, deduped by filename)
11. **Image gallery / slider** → `media.image-gallery` (images uploaded same way as brand logos)
12. **Newsletter signup** → `forms.newsletter` (limited — only the `hubspotForm` relation is migrated; frontend renders fixed copy)
13. **Disclaimer notice** → `sections.disclaimer` (title + content; SKIP if the v5 frontend renders it hardcoded for the route)
14. **3-column stat/issue grid (required heading)** → `sections.three-column-grid` (items = `elements.how-it-works-item`; `itemStyle: "bordered"` for emphasis variants like `slices.issues-header`)
15. **Tabbed feature strip (pill tabs, one feature-overview per tab)** → `sections.tabbed-feature-overview` (each tab requires an image — uploaded via the brand-logo routine; tabs without images get SKIPPED)
16. **Customer reviews carousel** → `sections.reviews` (title required; reviews relation resolved against `api::review.review` by author match; relation left empty for manual follow-up if no matches)
17. **Auto-fetched chronological list (no fields)** → `sections.news-list` (empty payload — frontend handles fetching)

Everything else → `migration.data-sink` (if allowed) or SKIP.

The detailed per-slice rules in Step 6 are refinements of this heuristic with the exact field mapping.

## Inputs

| Input           | Required | Default          | Description                                                                                              |
| --------------- | -------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `urls`          | yes      | —                | Whitespace/newline-separated list of URLs (any host — only the path matters)                             |
| `source_server` | no       | `production-old` | Strapi MCP server to read from                                                                           |
| `target_server` | no       | `production`     | Strapi MCP server to write to                                                                            |
| `mode`          | no       | `replace`        | `replace` wipes+rebuilds the target dynamic zone; `append` adds to existing. Default is `replace`.       |
| `publish`       | no       | `true`           | After successful migration, publish the target record                                                    |
| `media_policy`  | no       | `reuse-existing` | If target record already has cover/logo set, leave them; else upload from old if old has them; else skip |

Everything else (target documentId, category documentIds, schema mapping) is discovered at runtime.

## URL → content type mapping

Detect content type from the URL **path** prefix. The host doesn't matter — `strapi.io`, `website-ui-omega.vercel.app`, `localhost:3000` all resolve the same.

| URL path pattern                                                                                                                          | Old endpoint                                                                                                                                                                                                                                                                                         | New endpoint          | Target content type   | Match by                         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/user-stories/<slug>`                                                                                                                    | `api/case-studies`                                                                                                                                                                                                                                                                                   | `api/case-studies`    | case-study            | slug                             |
| `/blog/<slug>`                                                                                                                            | `api/blog-posts`                                                                                                                                                                                                                                                                                     | `api/blog-posts`      | blog-post             | slug                             |
| `/news/<slug>`                                                                                                                            | `api/news-items`                                                                                                                                                                                                                                                                                     | `api/news-items`      | news-item             | slug                             |
| `/jobs/<slug>`                                                                                                                            | `api/internal-jobs`                                                                                                                                                                                                                                                                                  | `api/internal-jobs`   | internal-job          | slug                             |
| `/comparators/<slug>` or `/<slug>-vs-<slug>` or `/headless-cms/comparison/<slug>`                                                         | `api/comparators`                                                                                                                                                                                                                                                                                    | `api/cms-comparisons` | cms-comparison        | slug                             | (source v4 collection is **`api/comparators`** — NOT `api/cms-comparisons`, which is the v5 target name. The comparison index `/headless-cms/comparison` itself is a `page`, see below.)                                                       |
| `/solutions/<slug>`                                                                                                                       | `api/use-cases`                                                                                                                                                                                                                                                                                      | `api/pages`           | **page** (cross-type) | `fullPath` = `/solutions/<slug>` |
| `/features` and `/features/<slug>`                                                                                                        | (CONFIRMED no per-slug v4 source — `api/feature` is a single-type covering only the `/features` index; `features`/`single-features`/`product-features`/`capabilities`/`feature-pages` all 404; `universals` has no fullPath and matches only slug `content-types-builder`, an unrelated legacy page) | `api/pages`           | **page** (cross-type) | `fullPath`                       | Feature pages appear **v5-native**: the target `page` already carries draft content and there is no v4 source to read. → treat as **validate-only** (do NOT replace-overwrite); only migrate if a real v4 source record is located at runtime. |
| any other multi-segment path with no prefix above (e.g. `/headless-cms`, `/headless-cms/comparison`, list roots `/blog`, `/user-stories`) | `api/universals` (if a matching universal exists)                                                                                                                                                                                                                                                    | `api/pages`           | **page** (cross-type) | `fullPath` = the exact path      | List/index pages are `page` records (hero + frontend-auto-fetched lists). If no v4 universal matches the fullPath, validate-only.                                                                                                              |
| `/<slug>` (top-level, no prefix above)                                                                                                    | `api/universals` — **FALLBACK: if no universal matches the slug, probe a same-named single-type `api/<slug>`** (confirmed: `careers`→`api/career`, `community`→`api/community`; these hold `slices[]` directly, sometimes without a universal-style root hero)                                       | `api/pages`           | **page** (cross-type) | `fullPath` = `/<slug>`           |

**Before replace-migrating ANY page, check whether the target already has curated/v5-native content AND whether a real v4 source record exists.** If there is no locatable v4 source (e.g. feature pages, some list/index pages), do NOT wipe the target — switch to **validate-only** (Playwright-check the existing render, report, leave content intact). `replace` is only safe when a canonical v4 source exists to rebuild from.

Cross-type rules: old `use-case` and `universal` records are collapsed into the new `page` collection. Lookup the target by `fullPath` (not `slug`), because multiple pages can share a slug across different parent paths.

If the URL path matches none of the above, skip it (add to `unmatchedUrls`). Do NOT guess.

Mixed batches are fine — group per-type internally so schema inspection only runs once per type.

## Steps

### 1. Verify MCP + servers

```
mcp__strapi-local__strapi_list_servers()
```

If `source_server` or `target_server` is missing → report and stop. Do not offer to install MCP. If user clearly needs setup, recommend `/setup-strapi-mcp` in the final report.

### 2. Parse URLs and group by content type

Extract `{pathSegment, slug, contentType, oldEndpoint, newEndpoint, matchField, matchValue}` per URL. Drop unmatched. De-duplicate.

### 3. Inspect local target schema (once per content type)

Read `apps/strapi/src/api/<content-type>/content-types/<content-type>/schema.json`. Capture:

- Dynamic-zone field name (usually `content`) and its allowed component UIDs
- Required top-level fields
- Relation fields and their targets (for category-like lookups)
- Media/component fields (coverImage, logoImage, seo, etc.)

Also walk each allowed component's schema (`apps/strapi/src/components/<group>/<name>.json`) to capture required subcomponent fields (e.g. `cards.feature-card.title`, `sections.feature-card-grid.items` required, `media.brand-logo-grid.items[].image.media` required — uploading media is expensive; prefer to SKIP such slices unless explicitly requested).

### 4. Discover target category-like relations (once per content type)

For each relation field pointing to a taxonomy (e.g. `case-study-category`, `blog-tag`), fetch all records from the **target** server:

```
mcp__strapi-local__strapi_rest({ server: target_server, endpoint: "api/<plural>", method: "GET", params: { pagination: { limit: 100 } } })
```

Build a `{ name → documentId }` map per relation. Use this at write time — do not hardcode documentIds.

### 5. Find target documentIds for the batch (once per content type)

For slug-matched types:

```
mcp__strapi-local__strapi_rest({
  server: target_server,
  endpoint: "api/<plural>",
  method: "GET",
  params: {
    filters: { slug: { $in: [<slug1>, <slug2>, ...] } },
    fields: ["slug", "title", "description", "companyName", "publishedAt"],
    pagination: { limit: 100 },
    status: "draft"
  }
})
```

For `fullPath`-matched pages, use `filters: { fullPath: { $in: [<"/market-guidelines">, <"/solutions/ecommerce-cms">, ...] } }` and include `fullPath` in `fields`.

For each row:

- **Found** → reuse `documentId`
- **Not found** → create a draft shell first via POST with minimal required fields so the agent has a documentId to write to.

Do NOT query `populate: { content: { fields: [...] } }` — 500 error on Strapi Cloud. Use `populate: { content: true }` or omit populate.

### 5.5 Visual mapping pass — for new or ambiguous slice types

Step 6 rules are schema-aware but **not visual-aware**. Two slices with the same name can render very differently per page; same target component can look right or wrong depending on variant/layout flags that no rule can pick without seeing the source. This step grounds the mapping decision in actual rendered visuals before any write.

**Why this exists**: rule-driven migrations consistently produce data-correct but visually-divergent output. The fix isn't more rules — it's letting the agent SEE the source section and the candidate v5 component side-by-side, then choose. Skip this step only when the cache already has a decision for the exact slice type + shape.

#### When to run

For each batch, identify the set of `(source_uid, shape_hash)` pairs that appear. The `shape_hash` captures polymorphic variants — compute as the sorted list of populated top-level keys on the slice, joined with `+` (e.g. `description+features+title+upperTitle` vs `image+logos+upperTitle+whiteCards`).

- **Run Step 5.5 for any (uid, shape) not in `visual-cache.json`** (sibling of this skill).
- **Skip for cached entries** — Step 6 reads the cached decision directly.

#### Protocol — per uncached (uid, shape)

1. **Capture source render**:
   - Find a URL in the batch that has this slice + shape. Navigate via `mcp__plugin_playwright_playwright__browser_navigate`.
   - Run `mcp__plugin_playwright_playwright__browser_evaluate` to locate the section. Match by the slice's resolved TITLE (per 6.0) or by the position of the slice in `slices[]` against H2 headings in the rendered DOM:
     ```js
     // Find the h2 / h3 / section by text from the slice's resolved TITLE
     const titles = Array.from(document.querySelectorAll("h1, h2, h3"))
     const match = titles.find((h) => h.textContent.includes("<TITLE>"))
     match
       ?.closest('section, [class*="Section"], [class*="section"]')
       ?.getBoundingClientRect()
     ```
   - Take a tight screenshot (`browser_take_screenshot` with `element` reference from the snapshot). Save to `<workspace>/visual-pass/source-<uid>-<shape>.png`.

2. **Resolve default candidate**:
   - Run the Step 6 rule for this `(uid, shape)`. Get the candidate v5 UID + variant/layout/imagePosition flags.

3. **Capture candidate v5 render**:
   - Navigate to `https://website-ui-omega.vercel.app/dev/component-library`.
   - Find the section labeled with the candidate component's display name (read `info.displayName` from `apps/strapi/src/components/<group>/<name>.json` — e.g. `sections.feature-card-grid` → "FeatureCardGrid"; `sections.three-column-grid` → "ThreeColumnGrid"; `sections.cta-banner` → "CTA Banner").
   - The page has H2 headings per top-level component and H3 headings per variant. Use `browser_evaluate` to locate the candidate's H2 and the nearest H3 sub-variant that matches the planned flags (e.g. variant=bordered → "Bordered Stacked Card"; size=sm → "Content size: sm").
   - Take a tight screenshot of that variant. Save to `<workspace>/visual-pass/candidate-<uid>.png`.

4. **Decide**:
   - Compare the two screenshots. Three outcomes:
     - **Close match**: accept the Step 6 default. Cache it.
     - **Wrong variant**: same component family but different variant/layout. Browse other H3 variants of the same H2 component. Cache the corrected flags.
     - **Wrong component**: the candidate is the wrong v5 component entirely. Scan the page's H2 list (use `browser_evaluate` to list all H2s and their y-positions) for a component whose visual matches better. Common second-guesses:
       - `cards.feature-card` (no image) → `sections.section-header` or `cards.content-card`
       - N×`cards.content-card` standalone → `sections.feature-card-grid` (with feature-card items mapped from content-card shape)
       - `sections.feature-card-grid` plain → bordered variant or `sections.three-column-grid`
   - **No good match**: emit `migration.data-sink` if allowed; else SKIP. Cache with `v5_component: "SKIP"` + reason.

5. **Cache the decision** in `visual-cache.json`:
   ```json
   {
     "<source_uid>:<shape_hash>": {
       "v5_component": "sections.three-column-grid",
       "variant": "bordered",
       "layout": "third",
       "image_position": null,
       "decided_at": "2026-05-24",
       "source_screenshot": "<workspace>/visual-pass/source-...",
       "candidate_screenshot": "<workspace>/visual-pass/candidate-...",
       "override_reason": "Step 6 default was feature-card-grid plain; visual shows bordered tiles with prominent layout — three-column-grid bordered matches the source much better."
     }
   }
   ```

#### Cache invalidation

The cache is a permanent record across batches. Reset by deleting `visual-cache.json` when:

- The component library page changes substantially (new components, redesigned variants).
- A frontend redesign changes how a v5 component renders.
- A misclassification is discovered on a later page.

Pass `--reset-visual-cache` (or just delete the file) before re-running a batch to re-evaluate everything.

#### Budget

~30s of Playwright work per uncached `(uid, shape)`. For a typical 50-URL batch with 10-15 unique slice shapes, ~5-8 minutes upfront. Per-URL overhead afterward = 0 (cache hits). Worth it: eliminates the entire class of visual-mismatch bugs at migration time.

### 6. Slice → component mapping

The rules below expand `components-cheatsheet.csv` into runnable code-form. **Consult `visual-cache.json` first** — if there's a cached decision for the slice's `(uid, shape)`, use it verbatim and skip the rule. Step 6 is the fallback default when no cache exists. Prefer the real target component over `migration.data-sink` — only fall back to data-sink if **no real v5 component fits** and the target schema allows `migration.data-sink`.

**Why these rules are forgiving**: v4 slice authors used inconsistent field names. Eyebrow text is `upperTitle` on most slices but `label` inside `intro` blocks. Repeatable items live under `features[]` on issues-header, `capabilityCards[]` on capability-cards, `whiteCards[]` on side-hero-with-image, `cards[]` on stacking-cards, `integrations.data[]` on integration-cards-grid. A rule that hardcodes one field name produces empty output when the slice uses a synonym. **Every rule below resolves fields through aliases first, then dispatches by shape.** When in doubt, look at the actual populated keys on a sample of the source data before mapping — see Step 8 populate for the shapes you need to fetch.

#### 6.0 Universal field-resolution

For every slice, resolve these concepts via ordered alias lookup (first non-empty wins):

| Concept                                  | Aliases (try in order)                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **LABEL** (eyebrow / kicker above title) | `upperTitle` → `label` → `eyebrow` → `kicker` → `intro.label` → `intro.upperTitle`                                                  |
| **TITLE** (main heading)                 | `title` → `intro.title` → `heading` → `headline`                                                                                    |
| **DESCRIPTION** (body / lead text)       | `description` → `text` → `intro.text` → `intro.description` → `content` → `body`                                                    |
| **ITEMS** (repeatable cards/tiles)       | `features` → `items` → `cards` → `capabilityCards` → `whiteCards` → `stats` → `companyStats` → `integrations.data` → `reviews.data` |
| **CTA** (single primary CTA)             | `button` → `intro.button[0]` → `cta` → `ctaLink` → `link`                                                                           |
| **CTAs** (multiple CTAs)                 | `buttons` → `ctaLinks` → `links` → `intro.button`                                                                                   |
| **IMAGE**                                | `image` → `cover` → `coverImage` → `media` → `picture`                                                                              |
| **ICON**                                 | `icon` → `iconImage`                                                                                                                |
| **HERO_INTRO** (nested hero block)       | `hero.intro` → `hero` → `intro` → root                                                                                              |

When a rule says "from LABEL" it means run the LABEL resolver. When it says "items from ITEMS" it means run the ITEMS resolver. The rule body specifies which **shape** of v5 component to emit; the resolver picks the actual field name at runtime per source data.

If all aliases for a required concept resolve to empty/null, the rule SKIPs the slice (or that fragment of a composite) and reports the reason.

#### 6.1 Polymorphic shape dispatch

Several v4 slice UIDs cover several different visual shapes (same UID, different populated fields). For these slices, detect what's actually present and pick the v5 component accordingly. This is more important than the per-slice tables below — when in doubt, treat the table as the default and 6.1 as the override.

| Slice                         | Shape (detect by)                                          | → v5                                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.side-hero-with-image` | `isHero === true` (it's the PAGE hero, not a body section) | `sections.hero` `{ label: upperTitle, title, description, image: <basic-image via find-before-upload>, ctas: button?[0]?.link ? [resolveLink] : [] }`. PREPEND. This branch wins over the body-section shapes below when `isHero` is set. |
| `slices.side-hero-with-image` | `whiteCards.length > 0` (stats grid)                       | `sections.three-column-grid` (itemStyle=default; items=`elements.how-it-works-item` each `{ title: card.title, description: card.text, icon: <upload card.icon> }`). Section from LABEL/TITLE/DESCRIPTION.                                |
| `slices.side-hero-with-image` | `logos.length > 0` (brand wall)                            | composite `sections.section-header` (LABEL/TITLE/DESCRIPTION) + `media.brand-logo-grid` (logos uploaded via routine)                                                                                                                      |
| `slices.side-hero-with-image` | `image` populated AND no whiteCards/logos                  | composite `sections.section-header` + `cards.feature-card` (variant=bordered, layout=full, imagePosition=right with the image, ctaLinks from CTAs)                                                                                        |
| `slices.side-hero-with-image` | `features.length > 0` only                                 | composite `sections.section-header` + `sections.two-column-grid` (items=how-it-works-item from features)                                                                                                                                  |
| `slices.side-hero-with-image` | none populated                                             | `sections.section-header` only                                                                                                                                                                                                            |
| `slices.text-slice`           | has CTA (button on slice or `content.button`)              | `sections.cta-banner`                                                                                                                                                                                                                     |
| `slices.text-slice`           | `theme === "purple"`                                       | `sections.section-header` (inner utilities.section-header.variant=purple)                                                                                                                                                                 |
| `slices.text-slice`           | otherwise                                                  | `sections.richtext` (markdown from LABEL/TITLE/DESCRIPTION)                                                                                                                                                                               |
| `slices.intro`                | first slice on page AND no root-level hero with a title    | `sections.hero`                                                                                                                                                                                                                           |
| `slices.intro`                | otherwise                                                  | `sections.section-header`                                                                                                                                                                                                                 |

For each row in 6.1, the rule for that slice in the per-slice tables below points back here.

**Rich text / text**

| Old                            | Target                       | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.universal-rich-text`   | `sections.richtext`          | `{ content: richText }`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `slices.text-slice`            | conditional (see 6.1)        | Shape dispatch from 6.1. **Field note:** title/text often nest under a `content` _component_ sub-field — resolve TITLE via `title → content.title → intro.title` and DESCRIPTION via `text → content.text → description → intro.text`, and deep-populate `content` per the Step 8 special case (else the slice reads empty and gets skipped). For the cta-banner branch: `section: utilities.section-header` from `{label: LABEL, title: TITLE, description: DESCRIPTION, ctaLinks: CTAs}`, background "dark-inverse". For the purple-theme branch: `sections.section-header` with inner `utilities.section-header.variant = "purple"`. **For a plain heading+lead block (TITLE+DESCRIPTION, `alignCenter`, no prose markdown): prefer `sections.section-header` (layout=center) over `sections.richtext`** — richtext is for prose paragraphs. Only use the richtext branch for actual markdown body. **CTA on a LIGHT block (recurs on case-studies — the "Enterprise Edition / Scale your Strapi project / Discover our plans" footer block):** when the text-slice carries a CTA (`content.button[0].link`) and renders as a light promo block, emit `sections.section-header` (background=light, layout=center) WITH `ctaLinks` from `content.button[0].link` — do NOT drop the CTA and do NOT use cta-banner (it only offers dark backgrounds). SKIP if LABEL/TITLE/DESCRIPTION/CTA all empty. |
| `slices.text-with-key-numbers` | `sections.three-column-grid` | INTERIM mapping (renders cleanly as a stats block, same as `company-stat-list`): `section` from intro LABEL/TITLE/DESCRIPTION; `items` = `keyNumber[]` each `{ title: n.number, description: n.text }`; `itemStyle: "default"`. Deep-populate `populate[slices][on][slices.text-with-key-numbers][populate][keyNumber][populate]=*`. SKIP only if both intro and keyNumber are empty. (Supersedes the old SKIP/"awaiting key-numbers component": three-column-grid keeps the stats VISIBLE and is NOT the retired richtext-bullets hack. Upgrade to a dedicated key-numbers component if one is later built — flagged to user.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Hero / intro**

`slices.intro` is position-dependent because v4 conflated "page hero" and "section heading" into one slice. Use the position in `slices[]` plus the presence of a root-field hero to decide:

| Old                | Target                    | Rule                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.intro`     | conditional (see 6.1)     | Shape dispatch from 6.1. v4 wraps fields under `content.*`, so the resolver looks up TITLE/DESCRIPTION/CTA via `intro.*`/`content.*` automatically. For the hero branch: `sections.hero` with all fields. For the section-header branch: `sections.section-header` with inner `utilities.section-header` (layout=center). SKIP if no TITLE in either branch. |
| `slices.new-intro` | `sections.section-header` | Heading-only block. `utilities.section-header` from `{label: LABEL, title: TITLE, description: DESCRIPTION, ctaLinks: CTAs}`. SKIP if no TITLE.                                                                                                                                                                                                              |

**Root-level hero fields** (handled outside `slices[]`, always PREPENDED to newContent so the hero sits at the top of the page):

| Field                                 | Target                                    | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCaseHero` (use-case records)      | `sections.hero`                           | Build from `useCaseHero.hero.intro.{label, title, text, button, cliContent?, smallTextWithLink?, newsWithLink?}`. SKIP if no `useCaseHero.hero.intro.title`.                                                                                                                                                                                                                                                                                                                                                      |
| `homeHero` (home universal)           | `sections.hero-home` OR PRESERVE existing | Path is **`homeHero.hero.intro.{theme, title, text, button, cliContent, smallTextWithLink, newsWithLink}`** (same nesting as useCaseHero). **When the target record already has a `sections.hero-home` at `content[0]`, preserve that component verbatim and DO NOT emit a new hero from this field** — the v5 hero-home schema is custom and has been hand-tuned. See Step 9 hero-preservation rule. When the target has no existing hero, build a `sections.hero` from `homeHero.hero.intro.*` as the fallback. |
| `whiteHero` (relevant universals)     | `sections.hero`                           | Same nesting as homeHero (`.hero.intro.*`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `careersHero` (careers universal)     | `sections.hero`                           | Same nesting. If `careersHero.image` (or `.coverImage`) is present, upload it via the media policy and attach.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `featuresHero` (relevant universals)  | `sections.hero`                           | Same nesting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `communityHero` (community universal) | `sections.hero` + `media.brand-logo-grid` | PREPEND `sections.hero` from `communityHero.hero.intro.{label, title, text, button}`. Then, if `communityHero.brandsWithIntro` is present, APPEND a `media.brand-logo-grid` built from its logos.                                                                                                                                                                                                                                                                                                                 |

Always populate this set in the explicit populate spec (Step 8) for the relevant content types — `populate=*` won't reach into `useCaseHero.hero.intro` etc.

**CTA field name gotcha:** all of these map to `sections.hero` (or `sections.hero-home`), whose repeatable CTA field is **`ctas`** (`utilities.link`) — NOT `ctaLinks` like `section-header`/`feature-card`/`cta-banner`. Map source `intro.button[0].link` → `ctas: [resolveLink(button[0].link)]`. Hero scalar mapping: `label→label`, `title→title`, `text→description` (richtext). Using `ctaLinks` on the hero silently drops the CTA (Strapi ignores unknown keys — no error).

**`resolveLink()` output shape (applies to EVERY `ctas`/`ctaLinks` entry skill-wide, not just heroes):** the v5 `utilities.link` schema is `{ type: "external"|"page", label: string, href: string, newTab: boolean }` — there is **NO `text` and NO `target` field**. Map the v4 `link` component: `link.text → label`, `link.target` (`"_self"→false`, `"_blank"→true`) `→ newTab`, `link.href → href`, and set `type: "external"` for absolute URLs and internal paths. Sending `text`/`target` fails the PUT with `400 Invalid key target`.

**Cards (single tile, no grid wrapper)**

The v5 `cards.feature-card` `layout` enum is `full | half | third`. CSV terminology "split image right/left" means the visual style where the card has text on one side and image on the other — that's `layout: "full"` with `imagePosition` set. There is no `split` layout value.

| Old                                   | Target                | Rule                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.section-with-image`           | `cards.feature-card`  | `{ title, description: text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", size: "default", layout: "full", ctaLinks: button?.link ? [resolveLink(button)] : [] }`. **Note the inversion**: v4 `textPosition` = where text is; v5 `imagePosition` = where image is. Flip it. SKIP if no title.                                           |
| `slices.text-next-to-image`           | `cards.feature-card`  | Same as section-with-image. `{ title: title \|\| content?.title, description: text \|\| content?.text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", layout: "full", ctaLinks: (content?.button \|\| []).map(resolveLink) }`. SKIP if no title.                                                                                          |
| `slices.text-next-to-big-image`       | `cards.feature-card`  | `{ title, description: text, imagePosition: "right", variant: "bordered", layout: "full", ctaLinks: [...] }`. Single card, image right. SKIP if no title.                                                                                                                                                                                                            |
| `slices.simple-text-next-to-image`    | `cards.feature-card`  | `{ title, description: text, imagePosition: "left", variant: "bordered", layout: "full", ctaLinks: [...] }`. Single card, image LEFT. SKIP if no title.                                                                                                                                                                                                              |
| `slices.text-with-image-and-gradient` | `cards.feature-card`  | `{ title, description: text, imagePosition: "right", variant: "bordered", layout: "full", ctaLinks: [...] }`. The v4 `DownloadLink` (or `button.download`) becomes a ctaLink — preserve its `href` and `label`. SKIP if no title.                                                                                                                                    |
| `slices.side-hero-with-image`         | polymorphic (see 6.1) | Shape dispatch by populated arrays: `whiteCards` → three-column-grid of stats; `logos` → section-header + brand-logo-grid; `image` only → section-header + feature-card; `features` only → section-header + two-column-grid; otherwise → section-header only. See 6.1 for the exact mapping per shape. SKIP if no shape fires AND LABEL/TITLE/DESCRIPTION all empty. |

**Grids of features / cards**

Two patterns here:

- Single-component grids: emit one `sections.feature-card-grid` or `sections.two-column-grid`. The grid's `section` field carries the heading — no separate `sections.section-header` needed.
- Composites: emit a standalone `sections.section-header` when the heading needs styling the built-in `section` field can't provide (e.g. boxed + dark wrapper). Otherwise prefer single-component.

`sections.feature-card-grid.items` is required and must be `cards.feature-card` — content-cards cannot be grid items. If the design calls for content-cards, emit them as N standalone `cards.content-card` entries in the dynamic zone (allowed by the page schema).

**⚠️ GRID ITEM FLAGS (recurring mistake — get this right):** every `cards.feature-card` INSIDE a `feature-card-grid` uses `layout: "third"` (3-column) or `"half"` (2-column) — **NEVER `layout: "full"`** and **NEVER `imagePosition`**. `full`/`imagePosition` are ONLY for a SINGLE standalone `cards.feature-card` (the `section-with-image` image-split family), not grid items — using them makes each tile a full-width bordered box (wrong). For **plain icon/title/text tile grids** (`slices.features-slice`, `slices.features-grid`, multi-column feature lists like financial-services' "Any channel, any device") use **`variant: "plain"`** and put the source per-card `icon` in the feature-card `icon` field (not `image`). Reserve `variant: "bordered"` for grids that are genuinely bordered by design (`integration-cards-grid`, `getting-started-grid`, `features-card`). When unsure, a multi-column tile grid defaults to `variant: plain, layout: third, no imagePosition`. **BENTO EXCEPTION:** a curated **bento** feature-card-grid may DELIBERATELY mix `full`/`half`/`third` for visual variety (wide hero card + smaller cards) and render well — if the target already has a deliberate mix that renders as a bento, PRESERVE it. Only "fix" `full` when it's applied UNIFORMLY to what should be a plain equal-tile grid (the actual error). Verify visually before flattening. **`imagePosition` is INERT on image-less tiles — don't chase it:** the enum is `left|right` with `default:"right"` and NO null, so Strapi re-applies `"right"` on every write even if omitted. The frontend gates image rendering on `hasImage` (`image != null`), so on a `variant:plain` tile with `image:null` the residual `imagePosition:"right"` has zero visual effect. The load-bearing flags are `variant` + `layout` + presence-of-image; a persisting `imagePosition:"right"` on a plain image-less tile is NOT a defect.

`sections.two-column-grid.section` is REQUIRED — always populate it. Items are `elements.how-it-works-item` (icon + title + description); the `icon` field is optional and matches v4 `feature.icon` when present.

| Old                             | Target                                                          | Rule                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.top-features`           | `sections.two-column-grid`                                      | Single component. `section: utilities.section-header` REQUIRED — `{label: LABEL, title: TITLE, description: DESCRIPTION}` with fallback `{ title: "Features" }`. `items` from ITEMS (typically `features[]`) filtered by title, each `{ title: f.title, description: f.description ?? f.text, icon: f.icon ? <upload> : undefined }`. SKIP if no items. Feature `.links` are dropped — how-it-works-item has no ctaLinks. |
| `slices.large-features-slice`   | `sections.two-column-grid`                                      | Same shape as top-features.                                                                                                                                                                                                                                                                                                                                                                                               |
| `slices.features-slice`         | `sections.feature-card-grid`                                    | `section` from LABEL/TITLE/DESCRIPTION. `items` from ITEMS (typically `cards[]`) filtered by title, `layout: s.layout==="two"?"half":"third"`, `variant: "plain"`. SKIP if empty.                                                                                                                                                                                                                                         |
| `slices.stacking-cards`         | composite: `sections.section-header` + N × `cards.content-card` | Emit `sections.section-header` from LABEL/TITLE/DESCRIPTION (skip header if empty). Then for each `card` in ITEMS (try `cards[]`, `items[]`) filtered by title, emit one `cards.content-card` with `{ label: card.label, title: card.title, content: card.description ?? card.text }` (content REQUIRED — SKIP cards with no body).                                                                                       |
| `slices.text-with-cards`        | `sections.feature-card-grid`                                    | Single component. `section` from LABEL/TITLE/DESCRIPTION. `items` from ITEMS filtered by title, each `{ title, description, icon: c.icon ? <upload> : undefined, variant: "plain", size: "sm", layout: "third" }`. SKIP if empty.                                                                                                                                                                                         |
| `slices.features-card`          | `sections.feature-card-grid`                                    | Single component on light background. `section` from LABEL/TITLE/DESCRIPTION. `items` from ITEMS filtered by title, each `{ title, description, imagePosition: "right", variant: "bordered", layout: "third" }`. SKIP if empty.                                                                                                                                                                                           |
| `slices.getting-started-grid`   | `sections.feature-card-grid`                                    | `section` from LABEL/TITLE/DESCRIPTION. `items` from ITEMS (try `cards[]`, `features[]`) filtered by title, each `{ title, description, variant: "bordered", layout: "third" }`. SKIP if empty.                                                                                                                                                                                                                           |
| `slices.integration-cards-grid` | `sections.feature-card-grid`                                    | `section` from `intro.{label, title, text}` (LABEL/TITLE/DESCRIPTION will resolve to intro.\* per the alias list). `items` = `integrations.data[]` filtered by `attributes.title`, cap at 12, each `{ title: attributes.title, description: attributes.description, ctaLinks: [{ type:"external", label: slice.buttonText ?? "Learn more", href:"/integrations/"+attributes.slug, newTab:false }] }`. SKIP if empty.      |
| `slices.company-stat-list`      | `sections.three-column-grid`                                    | Single component. `section` REQUIRED — from LABEL/TITLE/DESCRIPTION; fall back to `{ title: "Company Stats" }`. `items` from ITEMS (try `stats`, `companyStats`, `features`), each `{ title: stat.value ?? stat.number ?? stat.title, description: stat.label ?? stat.text }`. `itemStyle: "default"`. SKIP if no items. May also appear as root field on careers content type.                                           |
| `slices.issues-header`          | `sections.three-column-grid`                                    | Single component, `itemStyle: "bordered"`. `section` REQUIRED — from LABEL/TITLE/DESCRIPTION; fall back to `{ title: "Issues" }`. `items` from ITEMS (on this slice typically `features[]`) filtered by title, each `{ title: f.title, description: f.text ?? f.description }`. SKIP if no items.                                                                                                                         |

**Tabbed content**

| Old                       | Target                             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.capability-cards` | `sections.tabbed-feature-overview` | `section: utilities.section-header` REQUIRED — from LABEL/TITLE/DESCRIPTION on the slice (fall back to `{ title: "Capabilities" }`). `tabs[]` = ITEMS (on this slice typically `capabilityCards[]`) mapped to `elements.tabbed-feature` each: `{ tabLabel: c.upperTitle ?? c.label ?? c.title (REQUIRED — SKIP tab if absent), tabIcon: c.icon ? <upload> : undefined, content: sections.feature-overview { label: c.upperTitle ?? c.label, title: c.title (REQUIRED), description: c.text ?? c.description, ctaLinks: c.button ? [resolveLink(c.button)] : [], image: <upload c.image — REQUIRED, SKIP tab if no image survives>, items: (c.features ?? []).map(f => ({ title: f.title, description: f.text ?? f.description, icon: f.icon ? <upload> : undefined })) } }`. SKIP whole slice if no tabs survive. Image uploads use the find-before-upload routine. |

**Auto-fetched lists**

These components have empty schemas — the frontend auto-fetches data. Migration just registers the component on the page.

| Old                | Target               | Rule                                                                                                                                                                                |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.news-list` | `sections.news-list` | Emit `{ __component: "sections.news-list" }` with no fields. The target schema has zero attributes — frontend auto-fetches news items chronologically. Always succeeds; never SKIP. |

**Reviews**

| Old                     | Target                                                                | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.reviews-slider` | `sections.reviews` (preferred) OR N × `testimonials.quote` (fallback) | The v4 slice has reviews INLINE: each `reviews.data[*].attributes` has `author.{name, description, image}` and `text`. **First try the new component**: emit `sections.reviews` with `{ title: TITLE ?? "What customers say" (REQUIRED), subTitle: LABEL, description: DESCRIPTION, reviews: <resolved relation ids> }`. Resolve `reviews` relation by looking up each `author.name` against `api/reviews?filters[author][$eq]=<name>&fields=id,author` on the target server. If at least one resolves, emit `sections.reviews`. **If NO author names resolve to existing target review records** (the typical case when the target review collection isn't seeded), emit nothing for `sections.reviews` and instead **fall back to emitting N × `testimonials.quote` directly into the dynamic zone** using the inline data: `{ quote: r.text, authorName: r.author.name, authorRole: r.author.description ?? r.role ?? "", variant: "boxed" }`. Either branch preserves the content. Report the choice in the per-page log. |

**Section header / heading-only blocks**

For any slice that's essentially a label+title+description with no items below, emit `sections.section-header`. The inner `utilities.section-header` carries label/title/description/ctaLinks; the outer wrapper controls background and boxed treatment.

| Old                          | Target                    | Rule                                                                                                                                                   |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.chili-piper`         | `sections.section-header` | `{ section: { label, title, description: text, ctaLinks: button ? [resolveLink(button)] : [] }, background: "none", boxed: false }`. SKIP if no title. |
| `slices.content-videos-list` | `sections.section-header` | Same shape. The video items themselves are not migrated (out of scope unless caller opts into video uploads).                                          |

**CTA banners**

`sections.cta-banner.background` enum is `dark | dark-inverse` (default `dark-inverse`) — there is no light variant. If a v4 CTA needs a light treatment, fall through to `sections.section-header` with `background: "light"` instead.

| Old                      | Target                | Rule                                                                                                                                                                |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.dark-cta-banner` | `sections.cta-banner` | `{ section: { label, title, description: text, ctaLinks: button ? [resolveLink(button)] : [] }, background: "dark" }`. Section field is REQUIRED. SKIP if no title. |

**Forms**

| Old                        | Target             | Rule                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.newsletter-banner` | `forms.newsletter` | Limited migration. `forms.newsletter` has only a `hubspotForm` relation — frontend renders fixed copy. Resolve the v4 slice's HubSpot form id against the target's `api::hubspot-form.hubspot-form` collection (match on form id or name). If unresolvable, SKIP and report under `skipped` with reason `"newsletter has no resolvable hubspot-form"`. |
| `slices.embed-form`        | SKIP (by default)  | `forms.hubspot-form` requires a relation to an existing `api::hubspot-form.hubspot-form` record. Without a mapping config, skip + report. **Unchanged.**                                                                                                                                                                                               |

**Disclaimer**

| Old                 | Target                | Rule                                                                                                                                                                                                                                             |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.disclaimer` | `sections.disclaimer` | `{ title: slice.title, content: slice.content \|\| slice.text }`. `content` is REQUIRED — SKIP if empty. If the route is one where the frontend renders disclaimer copy hardcoded, the caller should pass an explicit skip list; otherwise emit. |

**Brand logos** — media uploads enabled

Brand-logo slices used to be SKIPPED to avoid media uploads. That non-goal has been retired: the skill now uploads logos from the old CDN, deduping by filename to avoid creating duplicate media entries.

| Old                        | Target                                                         | Rule                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.brands-with-intro` | composite: `sections.section-header` + `media.brand-logo-grid` | Emit `sections.section-header` from intro (`{label, title, description: intro.text, layout: "center"}`). Then emit `media.brand-logo-grid` populated by the upload-and-dedupe routine below. If the grid ends up with zero items (all uploads failed), emit only the section-header; if the intro is also empty, SKIP the whole slice. |
| `slices.brands`            | `media.brand-logo-grid`                                        | No intro available — emit just the grid. SKIP if no items survive upload.                                                                                                                                                                                                                                                              |

**Logo upload routine** (also used by `media.image-gallery` and root-level hero images):

```
for each logo in source.logos[]:
  url      = logo.image.data.attributes.url  (absolute on old CDN if it starts with http; otherwise prefix with old CDN host)
  stem     = FULL filename without extension, hash included (e.g. "rocket_5210f84d20.svg" → "rocket_5210f84d20")
  altText  = logo.image.data.attributes.alternativeText ?? logo.name ?? ""

  # find-before-upload (dedupe by filename)
  # Use the FULL stem (with hash), NOT a truncated prefix — a short stem like
  # "Content_bloc" $containsi-matches the wrong file (e.g. "Content_Blocks_Blog.gif").
  existing = GET /api/upload/files?filters[name][$containsi]=<stem> on target_server
  exact    = existing.filter(f => f.name without extension === stem)   # prefer exact stem match
  if exact.length:
    mediaId = max(exact, by id).id
  elif existing.length:
    mediaId = max(existing, by id).id        # last-resort: most recent contains-match
  else:
    downloaded = curl -L <url> → temp file
    mediaId    = mcp__strapi-local__strapi_upload_media({
                   server: target_server,
                   filePath: temp file,
                   name, alternativeText: altText
                 }).id

  items.push({
    image: { media: mediaId, alt: altText },
    hasLink: !!logo.link,
    link: logo.link ? resolveLink(logo.link) : undefined,
    tooltip: logo.tooltip ? { content: logo.tooltip } : undefined
  })
```

If a single logo fails to upload (network/permission), keep the item out of the grid and continue — the report's `mediaUploaded` field aggregates per-page upload results.

**Media**

| Old                   | Target                | Rule                                                                                                                                                                                            |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.large-video`  | `media.video`         | `{ url, alignment: "center" }`. SKIP if `url` missing. **Unchanged.**                                                                                                                           |
| `slices.image-slider` | `media.image-gallery` | `images[]` populated via the upload-and-dedupe routine (same as brand logos). `variant: "contained"` (or `"full-bleed"` if the slice has a `fullBleed` flag). SKIP if no images survive upload. |

**Quotes**

| Old                       | Target               | Rule                                                                                                                              |
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.quote`            | `testimonials.quote` | `{ quote, authorName: author?.name \|\| "Strapi", authorRole: author?.description \|\| "", variant: "boxed" }`. SKIP if no quote. |
| `slices.full-width-quote` | `testimonials.quote` | Same fields. \*\*`testimonials.quote.variant` enum is `boxed                                                                      | image`ONLY — there is NO`fullwidth`** (sending it fails validation). Use `variant: "boxed"`(or`"image"` if the source has an author image to feature). SKIP if no quote. |

**FAQ / interview**

The interview slice now gets a dark/boxed wrapper around the Q&A list. We keep `sections.faq-section` for the Q&A semantics (`utilities.accordions.{question, answer}` shape) but prepend a section-header for the visual treatment.

| Old                | Target                                                        | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.interview` | composite: `sections.section-header` + `sections.faq-section` | Emit `sections.section-header` first with `{ section: { label: slice.label, title: slice.title, description: slice.intro \|\| slice.text }, background: "dark", boxed: true }`. Skip header if all of label/title/intro are empty. Then emit `sections.faq-section` with `{ items: questionAnswer.filter(qa => qa.question && qa.answer).map(qa => ({ question, answer })) }`. SKIP the FAQ fragment if `questionAnswer` is empty after filter; SKIP the whole composite if both fragments would be empty. |

**Case study reference**

| Old                      | Target                  | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.case-study-card` | `cards.case-study-card` | The v5 component is a **relation-only** wrapper — schema is just `{ caseStudy: relation to api::case-study.case-study }` (companyName/title/cta come from the related record itself when the frontend renders). `slug = card?.data?.attributes?.slug`. Look up on **target** server: `api/case-studies?filters[slug][$eq]=<slug>&fields=slug`. If found, emit `{ caseStudy: <documentId> }` (pass the documentId string, not an object). SKIP if slug missing or target case study not found. **Do NOT send `companyName`, `title`, or `ctaLink` — those fields don't exist on the v5 schema and Strapi will reject the PUT.** |

**Algorithmic / always-skip**

| Old                           | Target | Rule                                                                                          |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `slices.related-case-studies` | SKIP   | Rendered algorithmically on the frontend; migrating creates duplicate content. **Unchanged.** |

**Fallback**

Anything not listed above → `migration.data-sink` IF allowed in the target dynamic zone: `{ sourceComponent: <old __component>, data: <full slice object> }`. If `migration.data-sink` is not allowed, SKIP + report.

**Before emitting any component**: verify its UID is in the dynamic-zone allowlist from Step 3. If not, use `migration.data-sink` (if allowed) or SKIP.

Required-field validation:

- Fragments whose required fields cannot be filled are SKIPPED (never sent with null values).
- Skipped fragments append to the report's `skipped` array with a reason + sliceType.
- Composites that produce two output components: if one fragment is invalid but the other is fine, emit the valid one and skip the invalid one (report each independently).

### 7. Content-length validation

- Trim `seo.metaTitle` to max 60 chars (word-boundary).
- Trim `seo.metaDescription` to max 160 chars. **It also has a MIN length of 50 chars on the v5 `shared.seo` schema** — a too-short value passes a draft PUT but FAILS the publish PUT (publish validation is stricter). If the source/target metaDescription is <50, extend it faithfully to ≥50 so the record can publish. (`metaTitle` max 60.)
- Check other string/text fields against `maxLength` if present in schema.
- Omit `metaImage` and `metaSocial` (v4 shapes that don't map cleanly).

On PUT validation failure, retry **once** without `seo`; then retry wrapping all items in `migration.data-sink` (if allowed) as a last-ditch; then report failed.

### 8. Deep populate — critical gotcha

Strapi v4 `populate=*` only goes one level deep. `populate=deep,N` sometimes works but is unreliable (does not always reach nested component fields like `useCaseHero.hero.intro`, and in some cases returns only the root fields). Always use **explicit nested populate** for the slices and any root-level components containing slices/intros. Tailor the populate per content type — pages built on `api/universals` need the home/white/careers/features/community hero fields populated; use-case pages need `useCaseHero`.

```
populate: {
  // "*" alone is NOT enough — it stops at the slice's own fields, so component
  // sub-fields (image→media, button→link) come back as empty shells {} / {theme}.
  // __all__:"*" keeps every slice field, then we deep-populate the common nested ones.
  slices: { populate: { __all__: "*", image: { populate: "*" }, button: { populate: "*" }, intro: { populate: "*" } } },
  // include only the root-hero fields that exist on the content type being fetched
  useCaseHero:    { populate: { hero: { populate: { intro: { populate: { __all__: "*", button: { populate: "*" }, smallTextWithLink: { populate: "*" }, newsWithLink: { populate: "*" } } } } } } }, // intro:{populate:"*"} stops at button as [{theme}] WITHOUT link → deep-populate button/smallTextWithLink/newsWithLink to reach .link.{href,text,target}. homeHero/whiteHero/featuresHero share this and need the same when those types are migrated.
  homeHero:       { populate: "*" },
  whiteHero:      { populate: "*" },
  careersHero:    { populate: { image: true, button: { populate: "*" } } },
  featuresHero:   { populate: "*" },
  communityHero:  { populate: { hero: { populate: { intro: { populate: "*" } } }, brandsWithIntro: { populate: { intro: { populate: "*" }, logos: { populate: { image: true, link: true } } } } } },
  seo: true
}
```

Verify by spot-checking one record in the batch: `slices[].cards[].title`, `slices[].features[].title`, `slices[].integrations.data[].attributes.title`, `useCaseHero.hero.intro.title`, `useCaseHero.hero.intro.button[0].link.href` (hero CTA), and the relevant `<x>Hero.title` (or `.hero.intro.title`) must all be present when the source has them. **Also confirm nested component sub-fields resolve, not just top-level keys**: on any card slice, `image.media.data.attributes.url` and `button.link.href` must be present when the source renders an image/CTA. A slice that shows `image: {}` or `button: {"theme":"link"}` is a SHALLOW-POPULATE symptom — the data exists, your spec just didn't reach it. If they come back empty or missing, the populate spec is wrong — fix before launching agents. (This was a real bug: `section-with-image` cards migrated image-less and CTA-less because `populate:"*"` never reached `image.media`/`button.link`. SAME BUG on the use-case hero: `useCaseHero` used `intro:{populate:"*"}`, which returned `button:[{theme}]` WITHOUT `link`, so the hero "Get Started" CTA was silently dropped on every use-case page; the spec now deep-populates `intro.button`/`smallTextWithLink`/`newsWithLink`. The hero `button` is an ARRAY — resolve the CTA from `button[0].link`.)

**Special case — image+button card slices** (`section-with-image`, `text-next-to-image`, `simple-text-next-to-image`, `text-next-to-big-image`, `text-with-image-and-gradient`, `side-hero-with-image`): each wraps its picture in an `image` _component_ (`image.media` is the actual media relation) and its CTA in a `button` _component_ (`button.link.{href,text,target}`). The default spec above deep-populates `image` and `button`, but verify `slices[].image.media.data.attributes.url` and `slices[].button.link.href` resolve on a sample. When mapping → `cards.feature-card`, emit BOTH: `image` = `utilities.basic-image` `{media: <deduped-id>, alt, width, height}` (via find-before-upload) and `ctaLinks` = `[utilities.link from button.link]`. Dropping either is the most visible fidelity loss on use-case pages.

**Special case — `slices.capability-cards`**: each card nests `image`, `icon`, `features[]`, and `button` underneath. `slices: { populate: "*" }` reaches the `capabilityCards` array but stops there. For batches that include capability-cards, deep-populate the card contents:

```
slices: { populate: { __all__: "*", capabilityCards: { populate: { image: true, icon: true, features: { populate: "*" }, button: { populate: "*" } } } } }
```

Verify by spot-checking that `capabilityCards[].image.data.attributes.url` resolves on a sample record.

**Special case — `slices.reviews-slider`**: needs `slices.<reviews-slider>.reviews: { populate: { author: { populate: { image: true } } } }` to reach author name/description/image and the review text on each related review (otherwise you only get review ids and can't match them against target, nor produce the fallback testimonials).

**Special case — `slices.side-hero-with-image`**: polymorphic — could populate any of `whiteCards`, `logos`, `features`, `image`. Populate ALL of them with their nested icon/media so shape detection at mapping time has full data:

```
slices: { populate: { __all__: "*", whiteCards: { populate: { icon: true, links: true } }, logos: { populate: { image: true, link: true } }, features: { populate: "*" }, image: true } }
```

**Special case — `slices.issues-header`**: populate `features: { populate: { links: true } }` so feature links survive.

**Special case — `slices.text-slice`**: stores its title/text under a nested `content` _component_ sub-field (`content.title`, `content.text`), NOT at the slice top level. The generic `slices: { populate: "*" }` / `__all__:"*"` does NOT reach it — the slice comes back as just `{layout, alignCenter, withBackground}` with `content: null`, and the resolvers find nothing → the section is silently skipped. Reach it with the per-component dynamic-zone populate: `populate[slices][on][slices.text-slice][populate]=*` (equivalently add `content: { populate: "*" }` to the slice populate). Verify `content.title`/`content.text` resolve on a sample before mapping.

**Special case — `api/comparators` (cms-comparison source) slices come back EMPTY under `__all__:"*"`.** On the comparators collection, `populate[slices][populate][__all__]="*"` (and plain `populate[slices][populate]=*`) returns `slices: []` — a populate quirk, NOT an empty source. ALWAYS re-fetch comparator slices with per-component `on` populate before concluding "nothing to migrate": `populate[slices][on][slices.content-cards-list][populate][cards][populate]=*` and `populate[slices][on][slices.faq][populate][categories][populate]=*` (`categories` alone returns `{name}` without its `questions`). General rule: for ANY dynamic zone, if `__all__:"*"`/`populate=*` yields an empty or shallow array, switch to per-component `populate[<dz>][on][<uid>][populate]=*` — never declare a source empty from the `__all__` result alone.

**Special case — `slices.brands` / `slices.brands-with-intro` logo nesting.** On (at least use-case) records, each brand item nests its media at **`brands[].logo.media`** (a `logo` component wrapping `media`), NOT the routine's documented `logos[].image.data.attributes.url`. The generic spec returns the brand items as empty `{}` (shallow-populate). Reach them with: `populate[slices][on][slices.brands][populate][brands][populate][logo][populate]=*` (and same for `slices.brands-with-intro`). In the logo-upload routine, treat `brands[].logo.media` as an alias for the logo media source.

**Verification-GET uses v5 (flat) media shape, not v4.** When confirming a write persisted, v5 returns media flat as `image.media.{id,url}` — there is NO `.data.attributes` wrapper. Verify with `populate[content][on][<uid>][populate][image][populate][media]=true` and read `image.media.url`. Using the v4 `image.media.data.attributes.url` path on a v5 GET returns `null` and triggers a FALSE shallow-populate alarm (the data is actually present).

**Special case — `homeHero` (and other root-field heroes)**: deep nesting at `.hero.intro.*` + `.hero.brands` + `.hero.animations[]` + `.hero.topRightBackgroundImage` + `.hero.bottomLeftBackgroundImage` + `.hero.features[]`. The home universal record can have all of these.

### 9. Launch one parallel agent per URL

Use the Agent tool with `general-purpose` subagent type, `run_in_background: true`, one agent per URL. All agents get the same shared context (schema map, category map, target server name, slice mapping) plus their own `{slug or fullPath, contentType, targetDocumentId}`.

Each agent's prompt must contain:

1. The slice → component mapping from Step 6 (universal resolvers + shape dispatch + per-slice rules).
2. The `{ name → documentId }` map for each relation field from Step 4.
3. The dynamic-zone allowlist from Step 3.
4. The explicit populate spec from Step 8.
5. The target content length limits from Step 7.
6. The brand-logo / image-gallery upload routine from Step 6 (find-before-upload by filename).
7. The rule "never publish from within the agent — only update the draft."
8. The rule "never emit `migration.data-sink` if a real component fits from the mapping; only use it as a LAST resort when `migration.data-sink` is explicitly allowed and the slice has no mapping."
9. The rule "DO NOT overwrite target `title`, `slug`, `fullPath`, `breadcrumbTitle`, `parent`, `children`, `companyName`, `coverImage`, `logoImage` — only send `content` and (optionally) `seo`."
10. **Hero preservation rule** (homepage-class records): when migrating a record whose source has a `homeHero` (or similar root hero field) AND the target's current `content[0]` is a `sections.hero-home` component, **read content[0] verbatim and prepend it unchanged to the new content[] array**. Do NOT regenerate the hero from the source; the v5 hero-home has been hand-tuned and the source schema doesn't carry equivalent fields. Same rule applies if the target's existing hero is any `sections.hero-*` custom variant.
11. A strict JSON report format (see Step 11).
12. **PUT payload hygiene (Strapi v5 rejects unknown/extra keys):** recursively STRIP every nested component `id` from the body (including inside the preserved hero from rule 10 — "prepend unchanged" means preserve the content + structure, but ids must still be removed), AND STRIP `__component` from every NESTED sub-component entry (`ctas[]`, `ctaLinks[]`, `section{}`, `items[]`, `image{}`, etc.) — `__component` is valid ONLY on the top-level dynamic-zone entries. Both fail the PUT otherwise: `Invalid key id` / `Invalid key __component`. **Don't strip the dynamic-zone ENTRY's own `__component` while stripping the nested ones.** A naive recursive `walk(del(.__component))` removes `__component` from EVERY object — including each top-level entry — and the PUT then fails (`400 Invalid key __component` / component-not-found). Strip `__component` only from NESTED sub-components; each top-level entry must KEEP its own. Safe jq, per entry: `{"__component": $entry.__component} + ($entry | <strip nested ids + nested __component>)`. (Avoid `del(.__component) | … | .__component = …` reassignment chains that can drop it.) **KEY ORDER MATTERS (confirmed by controlled experiment 2026-05-25): `__component` MUST be the FIRST key of every top-level dynamic-zone entry.** Strapi Cloud's validator is key-order sensitive — a byte-identical payload with `__component` placed LAST fails `400 Invalid key __component`; placed FIRST it succeeds (proven on `/cloud` with otherwise-identical content). Build each entry as `{"__component": uid, ...rest}` (jq `{"__component": $e.__component} + (rest)`) and preserve that order through serialization (don't let a re-sort move it). (This corrects an earlier wrong note that claimed order was insignificant — it is NOT.)

13. **Drop empty/media-less `utilities.basic-image` (and icon) shells before PUT.** When a target GET returns an OPTIONAL `image`/`icon` (basic-image) as a media-less shell `{id, alt, width, height}` with no `media`, echoing it back also triggers a (misleading) `Invalid key __component` / validation error. The `image`/`icon` field is optional on `elements.how-it-works-item` / `cards.feature-card` — so drop any such object that lacks a usable `media` id rather than sending the empty shell. **Likewise drop a `sections.section-header` whose `section` sub-component is null/empty** — it renders nothing AND fails the publish PUT (`content[N].section must be a object type ... null`). Drop it (or populate a minimal `section`) before publishing. (Common on terms/legal pages alongside the content-card-empty-title→richtext fix.)

The agent should:

- `ToolSearch({ query: "select:mcp__strapi-local__strapi_rest,mcp__strapi-local__strapi_upload_media", max_results: 2 })` to load MCP schemas.
- GET old record with the populate spec from Step 8.
- GET target record: `api/<plural>/<documentId>?populate[content]=true&populate[seo]=true&status=draft`.
- Map dynamic-zone per rules.
- For each `slices.brands` / `slices.brands-with-intro` / `slices.image-slider` and any root-hero with an image: run the find-before-upload routine, deduping by filename via `GET /api/upload/files?filters[name][$containsi]=<name>` before downloading + uploading.
- Upload cover/logo on the root record only if (old has URL) AND (target is null) — otherwise skip.
- PUT with `status=draft` and `userAuthorized=true`.
- Return the report JSON (including a per-page `logosUploaded` / `galleryImagesUploaded` count).

Wait on background notifications — do NOT poll or tail the output files.

### 10. Publish (if `publish: true`, which is the default)

After all agents complete, publish each successful target in parallel:

```
mcp__strapi-local__strapi_rest({
  server: target_server,
  endpoint: "api/<plural>/<documentId>",
  method: "PUT",
  params: { status: "published" },
  body: { data: {} },
  userAuthorized: true
})
```

Empty-body PUT with `?status=published` copies the draft to the published version on Strapi v5. Do NOT use `api/<plural>/<documentId>/actions/publish` — it returns 405 on Strapi Cloud's public REST API.

Skip publish for any record whose agent returned `status: "failed"`.

### 11. Report

One compact table plus a JSON summary. No narrative beyond one sentence.

Required report fields per URL:

- `slug` (or `fullPath` for pages)
- `documentId`
- `status` (`success` | `failed` | `skipped`)
- `oldSliceCounts`
- `newContentCounts`
- `skipped` (list of `{ reason, sliceType }`)
- `relationsAssigned` (e.g. categories)
- `mediaUploaded` (e.g. `{ coverImage: id|null, logoImage: id|null }`)
- `published` (bool)
- `error` (only if failed)

Plus a top-level `unmatchedUrls` list for URLs whose path couldn't be mapped.

## Defaults to apply (no confirmation)

- Mode: `replace` the target dynamic zone — even if target already has curated content. User invoked the skill → they accept replacement.
- Publish: yes, after successful migration.
- Media: reuse existing target media; upload from old only when target field is null AND old has a usable URL.
- Top-level scalars (title, description, companyName, fullPath, slug, breadcrumbTitle): NEVER overwrite. Only the dynamic zone + seo + originalPublishedAt may be written.
- Categories / taxonomies: resolve by name at runtime against the target server. Drop names that don't match.
- Quotes with missing author: fill `authorName: "Strapi"`. Flag in `skipped` with reason `"author fallback"`.
- Related-items slices: always skip.
- Unknown slice types: wrap in `migration.data-sink` if registered, else skip + report.
- Cross-type migrations (use-case/universal → page): standard procedure. Prepend `sections.hero` from `useCaseHero.hero.intro` when available.

## Non-goals

- **No inline-image migration**: markdown image URLs inside `sections.richtext` body keep pointing at the old CDN. (Brand logos, gallery images, and hero images ARE uploaded — see Step 6.)
- **No HTML scraping of strapi.io**: source data comes exclusively from the old Strapi MCP's API.
- **No HubSpot form mapping**: `slices.embed-form` is always skipped unless the user provides a hubspot-form relation map. `slices.newsletter-banner` is migrated only when its HubSpot form id can be resolved against the target's `api::hubspot-form.hubspot-form` collection — otherwise skipped.
- **No schema changes**: if a required target component is missing, skip the fragment and report — do NOT propose schema edits. That's the `/create-content-component` skill's job.
- **No retroactive re-render of frontend-hardcoded content**: if the v5 frontend renders disclaimers, related case studies, or newsletter copy from code rather than CMS, the corresponding slice migration produces nothing (those rows are explicit SKIPs in Step 6).

## Example invocations

### Slug-based (user-stories, blog)

```
/migrate-strapi-content
https://strapi.io/user-stories/airbus
https://strapi.io/blog/state-of-js-2024
https://strapi.io/user-stories/yuka-moves-fast-with-strapi-cloud
```

Skill groups 2 `case-study` + 1 `blog-post`, runs 3 agents, publishes.

### Path-based cross-type (pages from use-cases + universals)

```
/migrate-strapi-content
https://website-ui-omega.vercel.app/market-guidelines
https://website-ui-omega.vercel.app/solutions/ecommerce-cms
https://website-ui-omega.vercel.app/solutions/mobile-cms
```

Skill detects: 1 universal → page + 2 use-cases → page. Looks up each target by `fullPath`. Each use-case agent prepends `sections.hero` from `useCaseHero`. Runs 3 agents in parallel, publishes.

### Mixed batch

```
/migrate-strapi-content
https://strapi.io/user-stories/airbus
https://website-ui-omega.vercel.app/solutions/corporate-website-cms
https://strapi.io/blog/state-of-js-2024
```

Skill groups: 1 case-study + 1 page (from use-case) + 1 blog-post. 3 parallel agents, publishes.
