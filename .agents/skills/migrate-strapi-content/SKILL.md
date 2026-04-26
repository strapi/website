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

## Visual mapping reference

A live component library is available at **https://website-ui-omega.vercel.app/dev/component-library**. When uncertain which v5 component fits a v4 slice, fetch that page (Playwright or WebFetch) and match by rendered appearance. Prefer a real v5 component over `migration.data-sink`.

## Default mapping heuristic (use this as your mental model)

Most of the content in old slices falls into a handful of shapes. Before checking the detailed mapping table, ask which of these the old slice renders as:

1. **Columns / grid of cards (each with title + description)** → `sections.feature-card-grid`
   - Use when the slice has a repeatable `cards[]`, `features[]`, `items[]`, or `integrations[]` array of tiles.
   - The optional `section` field (utilities.section-header) carries the heading + description above the grid.
2. **Single boxed content block (title + description + optional CTA + optional image position)** → `cards.feature-card`
   - Use when the slice is a standalone content panel with one title and one body of text.
   - Examples: `slices.section-with-image`, `slices.text-next-to-image`.
3. **Multi-column feature list with a shared heading (smaller text-only tiles, not full cards)** → `sections.two-column-grid`
   - Use when items are short title+description pairs tightly grouped under one heading — no images, no CTAs.
   - Items are `elements.how-it-works-item` (title + description, both required).
4. **Self-contained heading / section separator (no grid below it)** → `sections.section-header`
   - Use for standalone label+title+description blocks that introduce a section but don't contain items.
   - Also the fallback for `slices.brands-with-intro` when logos can't be migrated — emit only the intro as a section-header.
5. **Paragraphs of markdown text** → `sections.richtext`
6. **Hero at the top of a page** → `sections.hero`
7. **Quote** → `testimonials.quote`
8. **Reference to a case study** → `cards.case-study-card` (with target lookup for `companyName`/`title`)

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

The following map was validated across case-study, blog-post, and page (use-case + universal) migrations. Prefer the real target component over `migration.data-sink` — only fall back to data-sink if **no real v5 component fits**, and the target schema allows `migration.data-sink`.

**Rich text / text**

| Old                            | Target              | Rule                                                                                                               |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `slices.universal-rich-text`   | `sections.richtext` | `{ content: richText }`. SKIP if empty.                                                                            |
| `slices.text-slice`            | `sections.richtext` | Markdown from `content.label` (bold), `content.title` (H2), `content.text`. SKIP if all empty.                     |
| `slices.text-with-key-numbers` | `sections.richtext` | `"## Key Numbers\n\n" + keyNumber.map(k => "- **"+k.number+"** — "+k.text).join("\n")`. SKIP if `keyNumber` empty. |

**Hero / intro**

| Old                                            | Target          | Rule                                                                                                                                         |
| ---------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.intro`                                 | `sections.hero` | from `content.{label, title, text, button}` (NOTE: v4 `slices.intro` wraps fields inside `content`, not at the top level). SKIP if no title. |
| root field `useCaseHero` (on use-case records) | `sections.hero` | PREPEND to newContent. Build from `useCaseHero.hero.intro.{label, title, text, button}`. SKIP if no `useCaseHero.hero.intro.title`.          |

**Cards**

| Old                         | Target               | Rule                                                                                                                                                                                                                                                                                                        |
| --------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.section-with-image` | `cards.feature-card` | `{ title, description: text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", size: "default", layout: "full", ctaLinks: button?.link ? [link] : [] }`. **Note the inversion**: v4 `textPosition` = where text is; v5 `imagePosition` = where image is. Flip it. SKIP if no title. |
| `slices.text-next-to-image` | `cards.feature-card` | `{ title: title \|\| content?.title, description: text \|\| content?.text, imagePosition: textPosition==="left"?"right":"left", variant: "bordered", size: "default", layout: "full", ctaLinks: (content?.button \|\| []).map(resolveLink) }`. SKIP if no title.                                            |

**Grids of features / cards**

| Old                             | Target                       | Rule                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.top-features`           | `sections.feature-card-grid` | `section` from `intro` or `{ title: "Features" }`; `items` = `features[]` filtered by `title`, each mapped to feature-card with `variant: "plain", layout: "third"`, `ctaLinks` from `.links`. SKIP entire slice if no items have title.                                                                                        |
| `slices.features-slice`         | `sections.feature-card-grid` | `section: s.title ? { title: s.title, layout: "center" } : undefined`; `items` = `cards[]` filtered by `title`, layout `s.layout==="two"?"half":"third"`, `variant: "plain"`. SKIP if empty. Omit `section` key when undefined.                                                                                                 |
| `slices.stacking-cards`         | `sections.feature-card-grid` | `section: s.title ? { title: s.title } : undefined`; items from `cards[]` filtered by title, `variant: "bordered", layout: "half"`. SKIP if empty.                                                                                                                                                                              |
| `slices.integration-cards-grid` | `sections.feature-card-grid` | `section` from `intro` if present; `items` = `integrations.data[]` filtered by `attributes.title`, cap at 12, map to feature-card with `title: attributes.title, description: attributes.description, ctaLinks: [{ type:"external", label:"Learn more", href:"/integrations/"+attributes.slug, newTab:false }]`. SKIP if empty. |

**Brand logos**

| Old                        | Target                    | Rule                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `slices.brands-with-intro` | `sections.section-header` | Emit ONLY the intro as section-header — logo rendering requires media uploads, which is out of scope by default. `{ section: { label, title, description: intro.text, layout: "center" }, background: "none", boxed: false }`. SKIP if intro is empty. |
| `slices.brands`            | SKIP                      | Pure-logo slice with no title — media upload needed. Skip + report.                                                                                                                                                                                    |

**Quotes**

| Old                                        | Target               | Rule                                                                                                                              |
| ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `slices.full-width-quote` / `slices.quote` | `testimonials.quote` | `{ quote, authorName: author?.name \|\| "Strapi", authorRole: author?.description \|\| "", variant: "boxed" }`. SKIP if no quote. |

**Media**

| Old                  | Target        | Rule                                                   |
| -------------------- | ------------- | ------------------------------------------------------ |
| `slices.large-video` | `media.video` | `{ url, alignment: "center" }`. SKIP if `url` missing. |

**FAQ / interview**

| Old                | Target                 | Rule                                                                                                  |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `slices.interview` | `sections.faq-section` | `{ items: questionAnswer.filter(qa => qa.question && qa.answer).map(qa => ({ question, answer })) }`. |

**Case study reference**

| Old                      | Target                  | Rule                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.case-study-card` | `cards.case-study-card` | `slug = card?.data?.attributes?.slug`. Look up on **target** server: `api/case-studies?filters[slug][$eq]=<slug>&fields=companyName,title,slug`. If found: `{ companyName, title, ctaLink: { type:"external", label: buttonText \|\| "Read story", href: "/user-stories/"+slug, newTab: false } }`. SKIP if slug missing or target not found. |

**Algorithmic / always-skip**

| Old                           | Target | Rule                                      |
| ----------------------------- | ------ | ----------------------------------------- |
| `slices.related-case-studies` | SKIP   | Rendered algorithmically on the frontend. |

**HubSpot forms**

| Old                 | Target            | Rule                                                                                                                                      |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `slices.embed-form` | SKIP (by default) | `forms.hubspot-form` requires a relation to an existing `api::hubspot-form.hubspot-form` record. Without a mapping config, skip + report. |

**Fallback**

Anything not listed above → `migration.data-sink` IF allowed in the target dynamic zone: `{ sourceComponent: <old __component>, data: <full slice object> }`. If `migration.data-sink` is not allowed, SKIP + report.

**Before emitting any component**: verify its UID is in the dynamic-zone allowlist from Step 3. If not, use `migration.data-sink` (if allowed) or SKIP.

Required-field validation:

- Fragments whose required fields cannot be filled are SKIPPED (never sent with null values).
- Skipped fragments append to the report's `skipped` array with a reason + sliceType.

### 7. Content-length validation

- Trim `seo.metaTitle` to max 60 chars (word-boundary).
- Trim `seo.metaDescription` to max 160 chars.
- Check other string/text fields against `maxLength` if present in schema.
- Omit `metaImage` and `metaSocial` (v4 shapes that don't map cleanly).

On PUT validation failure, retry **once** without `seo`; then retry wrapping all items in `migration.data-sink` (if allowed) as a last-ditch; then report failed.

### 8. Deep populate — critical gotcha

Strapi v4 `populate=*` only goes one level deep. `populate=deep,N` sometimes works but is unreliable (does not always reach nested component fields like `useCaseHero.hero.intro`, and in some cases returns only the root fields). Always use **explicit nested populate** for the slices and any root-level components containing slices/intros:

```
populate: {
  slices: { populate: "*" },
  useCaseHero: { populate: { hero: { populate: { intro: { populate: "*" } } } } },
  seo: true
}
```

Verify by spot-checking one record in the batch: the `slices[].cards[].title`, `slices[].features[].title`, `slices[].integrations.data[].attributes.title`, and `useCaseHero.hero.intro.title` fields must all be present when the source has them. If they come back empty or missing, the populate spec is wrong — fix before launching agents.

### 9. Launch one parallel agent per URL

Use the Agent tool with `general-purpose` subagent type, `model: "sonnet"`, `run_in_background: true`, one agent per URL. Sonnet is sufficient for this mechanical mapping work — Opus is wasted tokens here. All agents get the same shared context (schema map, category map, target server name, slice mapping) plus their own `{slug or fullPath, contentType, targetDocumentId}`.

Each agent's prompt must contain:

1. The slice → component mapping from Step 6.
2. The `{ name → documentId }` map for each relation field from Step 4.
3. The dynamic-zone allowlist from Step 3.
4. The explicit populate spec from Step 8.
5. The target content length limits from Step 7.
6. The rule "never publish from within the agent — only update the draft."
7. The rule "never emit `migration.data-sink` if a real component fits from the mapping; only use it as a LAST resort when `migration.data-sink` is explicitly allowed and the slice has no mapping."
8. The rule "DO NOT overwrite target `title`, `slug`, `fullPath`, `breadcrumbTitle`, `parent`, `children`, `companyName`, `coverImage`, `logoImage` — only send `content` and (optionally) `seo`."
9. A strict JSON report format (see Step 11).

The agent should:

- `ToolSearch({ query: "select:mcp__strapi-local__strapi_rest,mcp__strapi-local__strapi_upload_media", max_results: 2 })` to load MCP schemas.
- GET old record with the populate spec from Step 8.
- GET target record: `api/<plural>/<documentId>?populate[content]=true&populate[seo]=true&status=draft`.
- Map dynamic-zone per rules.
- Upload cover/logo only if (old has URL) AND (target is null) — otherwise skip.
- PUT with `status=draft` and `userAuthorized=true`.
- Return the report JSON.

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

- **No inline-image migration**: markdown image URLs keep pointing at the old CDN.
- **No HTML scraping of strapi.io**: source data comes exclusively from the old Strapi MCP's API.
- **No media uploads for brand logos**: `slices.brands` is always skipped. If the user wants logos migrated, that's a follow-up pass (upload media → build `media.brand-logo-grid.items[]`).
- **No HubSpot form mapping**: `slices.embed-form` is always skipped unless the user provides a hubspot-form relation map.
- **No schema changes**: if a required target component is missing, skip the fragment and report — do NOT propose schema edits. That's the `/create-content-component` skill's job.

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
