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

| URL path pattern                             | Old endpoint          | New endpoint          | Target content type   | Match by                         |
| -------------------------------------------- | --------------------- | --------------------- | --------------------- | -------------------------------- |
| `/user-stories/<slug>`                       | `api/case-studies`    | `api/case-studies`    | case-study            | slug                             |
| `/blog/<slug>`                               | `api/blog-posts`      | `api/blog-posts`      | blog-post             | slug                             |
| `/news/<slug>`                               | `api/news-items`      | `api/news-items`      | news-item             | slug                             |
| `/jobs/<slug>`                               | `api/internal-jobs`   | `api/internal-jobs`   | internal-job          | slug                             |
| `/comparators/<slug>` or `/<slug>-vs-<slug>` | `api/cms-comparisons` | `api/cms-comparisons` | cms-comparison        | slug                             |
| `/solutions/<slug>`                          | `api/use-cases`       | `api/pages`           | **page** (cross-type) | `fullPath` = `/solutions/<slug>` |
| `/<slug>` (top-level, no prefix above)       | `api/universals`      | `api/pages`           | **page** (cross-type) | `fullPath` = `/<slug>`           |

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

### 6. Slice → component mapping

The rules below expand `components-cheatsheet.csv` into runnable code-form. Prefer the real target component over `migration.data-sink` — only fall back to data-sink if **no real v5 component fits** and the target schema allows `migration.data-sink`.

**Rich text / text**

| Old                            | Target              | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.universal-rich-text`   | `sections.richtext` | `{ content: richText }`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `slices.text-slice`            | conditional (3-way) | Dispatch on slice fields: (a) if `content.button` (or top-level `button`) is present → `sections.cta-banner` with `section: utilities.section-header` from `{label, title, description: text, ctaLinks: [resolveLink(button)]}` and `background: "dark-inverse"`; (b) if `theme === "purple"` or equivalent → `sections.section-header` with the inner `utilities.section-header` carrying `variant: "purple"`; (c) otherwise → `sections.richtext` with markdown from `label` (bold), `title` (H2), `text`. SKIP if all of label/title/text/button are empty. |
| `slices.text-with-key-numbers` | SKIP                | No v5 component currently fits the `{number, text}[]` shape cleanly. Report in `skipped` with reason `"awaiting key-numbers component"` so the user can build it and revisit. (Avoid the old richtext-bullets workaround — the user is intentionally retiring it.)                                                                                                                                                                                                                                                                                             |

**Hero / intro**

`slices.intro` is position-dependent because v4 conflated "page hero" and "section heading" into one slice. Use the position in `slices[]` plus the presence of a root-field hero to decide:

| Old                | Target                                       | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.intro`     | `sections.hero` OR `sections.section-header` | If this is the FIRST entry of `slices[]` AND the record has no root-field hero (no `useCaseHero` / `homeHero` / `whiteHero` / etc. with a title) → emit `sections.hero` from `content.{label, title, text, button}`. Otherwise → emit `sections.section-header` with `background: "none", boxed: false` and inner `utilities.section-header` from the same fields (layout=center). SKIP if no title in either case. (v4 `slices.intro` wraps fields inside `content`, not at the top level.) |
| `slices.new-intro` | `sections.section-header`                    | Heading-only block. `utilities.section-header` from `{label, title, description: text, ctaLinks: button ? [resolveLink(button)] : []}`. SKIP if no title.                                                                                                                                                                                                                                                                                                                                    |

**Root-level hero fields** (handled outside `slices[]`, always PREPENDED to newContent so the hero sits at the top of the page):

| Field                                 | Target                                    | Rule                                                                                                                                                                                                                      |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCaseHero` (use-case records)      | `sections.hero`                           | Build from `useCaseHero.hero.intro.{label, title, text, button}`. SKIP if no `useCaseHero.hero.intro.title`. **Unchanged.**                                                                                               |
| `homeHero` (home universal)           | `sections.hero`                           | Build from `homeHero.{label, title, text, button}` (or nested `.hero.intro.*` — verify per record before mapping).                                                                                                        |
| `whiteHero` (relevant universals)     | `sections.hero`                           | Same as `homeHero`. Use `background: "light"` if the hero schema supports it; otherwise rely on default.                                                                                                                  |
| `careersHero` (careers universal)     | `sections.hero`                           | Same fields. If `careersHero.image` (or `.coverImage`) is present, upload it via the media policy (`reuse-existing` by default) and attach.                                                                               |
| `featuresHero` (relevant universals)  | `sections.hero`                           | Same as `homeHero`.                                                                                                                                                                                                       |
| `communityHero` (community universal) | `sections.hero` + `media.brand-logo-grid` | PREPEND `sections.hero` from `communityHero.hero.intro.{label, title, text, button}`. Then, if `communityHero.brandsWithIntro` is present, APPEND a `media.brand-logo-grid` built from its logos (see Brand logos below). |

Always populate this set in the explicit populate spec (Step 8) for the relevant content types — `populate=*` won't reach into `useCaseHero.hero.intro` etc.

**Cards (single tile, no grid wrapper)**

The v5 `cards.feature-card` `layout` enum is `full | half | third`. CSV terminology "split image right/left" means the visual style where the card has text on one side and image on the other — that's `layout: "full"` with `imagePosition` set. There is no `split` layout value.

| Old                                   | Target                                                      | Rule                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.section-with-image`           | `cards.feature-card`                                        | `{ title, description: text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", size: "default", layout: "full", ctaLinks: button?.link ? [resolveLink(button)] : [] }`. **Note the inversion**: v4 `textPosition` = where text is; v5 `imagePosition` = where image is. Flip it. SKIP if no title. |
| `slices.text-next-to-image`           | `cards.feature-card`                                        | Same as section-with-image. `{ title: title \|\| content?.title, description: text \|\| content?.text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", layout: "full", ctaLinks: (content?.button \|\| []).map(resolveLink) }`. SKIP if no title.                                                |
| `slices.text-next-to-big-image`       | `cards.feature-card`                                        | `{ title, description: text, imagePosition: "right", variant: "bordered", layout: "full", ctaLinks: [...] }`. Single card, image right. SKIP if no title.                                                                                                                                                                  |
| `slices.simple-text-next-to-image`    | `cards.feature-card`                                        | `{ title, description: text, imagePosition: "left", variant: "bordered", layout: "full", ctaLinks: [...] }`. Single card, image LEFT. SKIP if no title.                                                                                                                                                                    |
| `slices.text-with-image-and-gradient` | `cards.feature-card`                                        | `{ title, description: text, imagePosition: "right", variant: "bordered", layout: "full", ctaLinks: [...] }`. The v4 `DownloadLink` (or `button.download`) becomes a ctaLink — preserve its `href` and `label`. SKIP if no title.                                                                                          |
| `slices.side-hero-with-image`         | composite: `sections.section-header` + `cards.feature-card` | Emit `sections.section-header` first (from intro/label/title/text), then `cards.feature-card` (variant=bordered, layout=full, imagePosition=right) carrying the main content. SKIP whichever fragment is empty; if both are empty, SKIP the whole slice.                                                                   |

**Grids of features / cards**

Two patterns here:

- Single-component grids: emit one `sections.feature-card-grid` or `sections.two-column-grid`. The grid's `section` field carries the heading — no separate `sections.section-header` needed.
- Composites: emit a standalone `sections.section-header` when the heading needs styling the built-in `section` field can't provide (e.g. boxed + dark wrapper). Otherwise prefer single-component.

`sections.feature-card-grid.items` is required and must be `cards.feature-card` — content-cards cannot be grid items. If the design calls for content-cards, emit them as N standalone `cards.content-card` entries in the dynamic zone (allowed by the page schema).

`sections.two-column-grid.section` is REQUIRED — always populate it. Items are `elements.how-it-works-item` (icon + title + description); the `icon` field is optional and matches v4 `feature.icon` when present.

| Old                             | Target                                                          | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.top-features`           | `sections.two-column-grid`                                      | Single component. `section: utilities.section-header` from `intro` (or `{ title: "Features" }` as fallback — REQUIRED). `items` = `features[]` filtered by `title`, each `{ title: feature.title, description: feature.description, icon: feature.icon ? { media: <uploaded>, alt: feature.icon.alt } : undefined }`. SKIP entire slice if no items have title. (Feature `.links` are dropped — how-it-works-item has no ctaLinks. If preserving links is critical for a given migration, the caller can explicitly opt into `sections.feature-card-grid` instead.) |
| `slices.large-features-slice`   | `sections.two-column-grid`                                      | Same shape as top-features. Single component.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `slices.features-slice`         | `sections.feature-card-grid`                                    | `section: s.title ? { title: s.title, layout: "center" } : undefined`; `items` = `cards[]` filtered by `title`, `layout: s.layout==="two"?"half":"third"`, `variant: "plain"`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                                                       |
| `slices.stacking-cards`         | composite: `sections.section-header` + N × `cards.content-card` | Emit `sections.section-header` from `s.title/label/intro` (skip if empty). Then for each `card` in `cards[]` filtered by title, emit one `cards.content-card` directly into the dynamic zone with `{ label: card.label, title: card.title, content: card.description \|\| card.text }` (content is required — SKIP cards with no body).                                                                                                                                                                                                                             |
| `slices.text-with-cards`        | `sections.feature-card-grid`                                    | Single component. `section` from `title/intro`. `items` = `cards[]` filtered by title, each `{ title, description, icon: card.icon ? <upload> : undefined, variant: "plain", size: "sm", layout: "third" }`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                         |
| `slices.features-card`          | `sections.feature-card-grid`                                    | Single component on light background. `section` from intro if present. `items` = `cards[]` filtered by title, each `{ title, description, imagePosition: "right", variant: "bordered", layout: "third" }`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                           |
| `slices.getting-started-grid`   | `sections.feature-card-grid`                                    | `section` from intro/title if present. `items` = `cards[]` (or `features[]` — whichever the slice uses) filtered by title, each `{ title, description, variant: "bordered", layout: "third" }`. SKIP if empty.                                                                                                                                                                                                                                                                                                                                                      |
| `slices.integration-cards-grid` | `sections.feature-card-grid`                                    | `section` from `intro` if present; `items` = `integrations.data[]` filtered by `attributes.title`, cap at 12, each `{ title: attributes.title, description: attributes.description, ctaLinks: [{ type:"external", label:"Learn more", href:"/integrations/"+attributes.slug, newTab:false }] }`. SKIP if empty. **Unchanged.**                                                                                                                                                                                                                                      |
| `slices.company-stat-list`      | `sections.three-column-grid`                                    | Single component. `section: utilities.section-header` REQUIRED — fall back to `{ title: "Company Stats" }` if slice intro is empty. `items` = `stats[]` (or `companyStats[]` — whichever the slice uses) filtered by having any text, each `{ title: stat.value \|\| stat.number, description: stat.label \|\| stat.text }`. `itemStyle: "default"`. SKIP if no items survive. **Note**: on the Careers content type this may also appear as a root field — populate accordingly in Step 8 if so.                                                                   |
| `slices.issues-header`          | `sections.three-column-grid`                                    | Single component, `itemStyle: "bordered"`. `section` REQUIRED — fall back to slice intro/title, then `{ title: "Issues" }`. `items` = `issues[]` (or `items[]`) filtered by title, each `{ title: issue.title, description: issue.description }`. SKIP if no items survive.                                                                                                                                                                                                                                                                                         |

**Tabbed content**

| Old                                 | Target                             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.capabilities-dynamic-cards` | `sections.tabbed-feature-overview` | `section: utilities.section-header` REQUIRED — from slice intro/title (fall back to `{ title: "Capabilities" }`). `tabs[]` = `capabilities[]` (or `cards[]`) mapped to `elements.tabbed-feature` each: `{ tabLabel: capability.label \|\| capability.title (REQUIRED — SKIP tab if absent), tabIcon: capability.icon ? <upload> : undefined, content: sections.feature-overview { label: capability.label, title: capability.title (REQUIRED), description: capability.description, ctaLinks: (capability.button \|\| []).map(resolveLink), image: <upload — REQUIRED, SKIP tab if no image survives>, items: (capability.features \|\| []).map(f => ({ title: f.title, description: f.description, icon: f.icon ? <upload> : undefined })) } }`. SKIP whole slice if no tabs survive. Image uploads use the same find-before-upload routine from Step 6 brand logos. |

**Auto-fetched lists**

These components have empty schemas — the frontend auto-fetches data. Migration just registers the component on the page.

| Old                | Target               | Rule                                                                                                                                                                                |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.news-list` | `sections.news-list` | Emit `{ __component: "sections.news-list" }` with no fields. The target schema has zero attributes — frontend auto-fetches news items chronologically. Always succeeds; never SKIP. |

**Reviews**

| Old                     | Target             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.reviews-slider` | `sections.reviews` | `{ title: slice.title \|\| "What customers say" (REQUIRED — must be non-empty), subTitle: slice.label \|\| slice.subTitle, description: slice.text \|\| slice.description, reviews: <resolved relation ids> }`. To resolve the relation: take old `slice.reviews.data[]`, look up each on the target server: `api/reviews?filters[author][$eq]=<author>&fields=id,author`. Collect matching documentIds. If zero matches, leave `reviews` empty and add a `manual_followup` entry so reviews can be linked by hand. Component still emits as long as title resolves. |

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
  name     = derive filename from url (e.g. "rocket.svg" → "rocket")
  altText  = logo.image.data.attributes.alternativeText ?? logo.name ?? ""

  # find-before-upload (dedupe by filename)
  existing = GET /api/upload/files?filters[name][$containsi]=<name> on target_server
  if existing.length:
    mediaId = existing[0].id
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
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `slices.quote`            | `testimonials.quote` | `{ quote, authorName: author?.name \|\| "Strapi", authorRole: author?.description \|\| "", variant: "boxed" }`. SKIP if no quote. |
| `slices.full-width-quote` | `testimonials.quote` | Same fields, `variant: "fullwidth"`. SKIP if no quote.                                                                            |

**FAQ / interview**

The interview slice now gets a dark/boxed wrapper around the Q&A list. We keep `sections.faq-section` for the Q&A semantics (`utilities.accordions.{question, answer}` shape) but prepend a section-header for the visual treatment.

| Old                | Target                                                        | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.interview` | composite: `sections.section-header` + `sections.faq-section` | Emit `sections.section-header` first with `{ section: { label: slice.label, title: slice.title, description: slice.intro \|\| slice.text }, background: "dark", boxed: true }`. Skip header if all of label/title/intro are empty. Then emit `sections.faq-section` with `{ items: questionAnswer.filter(qa => qa.question && qa.answer).map(qa => ({ question, answer })) }`. SKIP the FAQ fragment if `questionAnswer` is empty after filter; SKIP the whole composite if both fragments would be empty. |

**Case study reference**

| Old                      | Target                  | Rule                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.case-study-card` | `cards.case-study-card` | `slug = card?.data?.attributes?.slug`. Look up on **target** server: `api/case-studies?filters[slug][$eq]=<slug>&fields=companyName,title,slug`. If found: `{ companyName, title, ctaLink: { type:"external", label: buttonText \|\| "Read story", href: "/user-stories/"+slug, newTab: false } }`. SKIP if slug missing or target not found. **Unchanged.** |

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
- Trim `seo.metaDescription` to max 160 chars.
- Check other string/text fields against `maxLength` if present in schema.
- Omit `metaImage` and `metaSocial` (v4 shapes that don't map cleanly).

On PUT validation failure, retry **once** without `seo`; then retry wrapping all items in `migration.data-sink` (if allowed) as a last-ditch; then report failed.

### 8. Deep populate — critical gotcha

Strapi v4 `populate=*` only goes one level deep. `populate=deep,N` sometimes works but is unreliable (does not always reach nested component fields like `useCaseHero.hero.intro`, and in some cases returns only the root fields). Always use **explicit nested populate** for the slices and any root-level components containing slices/intros. Tailor the populate per content type — pages built on `api/universals` need the home/white/careers/features/community hero fields populated; use-case pages need `useCaseHero`.

```
populate: {
  slices: { populate: "*" },
  // include only the root-hero fields that exist on the content type being fetched
  useCaseHero:    { populate: { hero: { populate: { intro: { populate: "*" } } } } },
  homeHero:       { populate: "*" },
  whiteHero:      { populate: "*" },
  careersHero:    { populate: { image: true, button: { populate: "*" } } },
  featuresHero:   { populate: "*" },
  communityHero:  { populate: { hero: { populate: { intro: { populate: "*" } } }, brandsWithIntro: { populate: { intro: { populate: "*" }, logos: { populate: { image: true, link: true } } } } } },
  seo: true
}
```

Verify by spot-checking one record in the batch: `slices[].cards[].title`, `slices[].features[].title`, `slices[].integrations.data[].attributes.title`, `useCaseHero.hero.intro.title`, and the relevant `<x>Hero.title` (or `.hero.intro.title`) must all be present when the source has them. If they come back empty or missing, the populate spec is wrong — fix before launching agents.

**Special case — `slices.capabilities-dynamic-cards`**: each capability nests `image`, `icon`, `features[]`, and `button[]` underneath. `slices: { populate: "*" }` reaches the capabilities but stops there. For batches that include capabilities-dynamic-cards, swap to:

```
slices: { populate: { __all__: "*", capabilities: { populate: { image: true, icon: true, features: { populate: "*" }, button: { populate: "*" } } } } }
```

Or pre-fetch one record with that explicit populate to confirm `capabilities[].image.data.attributes.url` resolves.

**Special case — `slices.reviews-slider`**: needs `slices.<reviews-slider>.reviews: { populate: "*" }` to reach author/text on each related review (otherwise you only get review ids and can't match them against target).

### 9. Launch one parallel agent per URL

Use the Agent tool with `general-purpose` subagent type, `run_in_background: true`, one agent per URL. All agents get the same shared context (schema map, category map, target server name, slice mapping) plus their own `{slug or fullPath, contentType, targetDocumentId}`.

Each agent's prompt must contain:

1. The slice → component mapping from Step 6.
2. The `{ name → documentId }` map for each relation field from Step 4.
3. The dynamic-zone allowlist from Step 3.
4. The explicit populate spec from Step 8.
5. The target content length limits from Step 7.
6. The brand-logo / image-gallery upload routine from Step 6 (find-before-upload by filename).
7. The rule "never publish from within the agent — only update the draft."
8. The rule "never emit `migration.data-sink` if a real component fits from the mapping; only use it as a LAST resort when `migration.data-sink` is explicitly allowed and the slice has no mapping."
9. The rule "DO NOT overwrite target `title`, `slug`, `fullPath`, `breadcrumbTitle`, `parent`, `children`, `companyName`, `coverImage`, `logoImage` — only send `content` and (optionally) `seo`."
10. A strict JSON report format (see Step 11).

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
