---
name: migrate-strapi-content
description: "Batch-migrate content from the old strapi.io Strapi instance (production-old MCP) to the current production Strapi (production MCP). Fully autonomous — paste a list of strapi.io URLs and nothing else is needed. Wraps the seed-content skill's schema-discovery rules but operates MCP-to-MCP (no HTML scraping). Triggers: migrate, batch migrate, migrate from production-old, bulk seed, batch seed urls, paste urls to migrate, seed stories from old, migrate user stories, migrate blog posts, migrate case studies."
---

# Migrate Strapi Content (batch, MCP-to-MCP)

Batch-migrate records from `production-old` (Strapi v4 at `api-prod.strapi.io`) to `production` (Strapi v5) via the Strapi MCP. Built for the common case where you paste a batch of `strapi.io/...` URLs and want zero further input.

## Hard rule: NEVER ask the user anything

This skill runs **fully autonomous by default**. Do NOT use `AskUserQuestion`, do NOT ask for approval, do NOT ask to choose replace/append, do NOT ask to publish. Apply the defaults below and report at the end. The user's input is the URL list — that is the entire contract.

If something truly cannot be decided from defaults + schema inspection (e.g. target content type unclear from URL), **skip that URL**, log it in the report, and continue. Do not stop the batch to ask.

Override is possible only if the user explicitly writes `interactive` or `ask me` in the prompt — then (and only then) you may ask.

## Inputs

| Input           | Required | Default          | Description                                                                                                                                |
| --------------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `urls`          | yes      | —                | Whitespace/newline-separated list of `strapi.io/*` URLs                                                                                    |
| `source_server` | no       | `production-old` | Strapi MCP server to read from                                                                                                             |
| `target_server` | no       | `production`     | Strapi MCP server to write to                                                                                                              |
| `mode`          | no       | `replace`        | `replace` wipes+rebuilds the target dynamic zone; `append` adds to existing. Default is `replace` because old records are source-of-truth. |
| `publish`       | no       | `true`           | After successful migration, publish the target record                                                                                      |
| `media_policy`  | no       | `reuse-existing` | If target record already has cover/logo set, leave them; else upload from old if old has them; else skip                                   |

Everything else (target documentId, category documentIds, schema mapping) is discovered at runtime.

## URL → content type mapping

Detect content type from the URL path prefix:

| URL pattern                     | Old endpoint        | New endpoint        | Content type |
| ------------------------------- | ------------------- | ------------------- | ------------ |
| `strapi.io/user-stories/<slug>` | `api/case-studies`  | `api/case-studies`  | case-study   |
| `strapi.io/blog/<slug>`         | `api/blog-posts`    | `api/blog-posts`    | blog-post    |
| `strapi.io/news/<slug>`         | `api/news-items`    | `api/news-items`    | news-item    |
| `strapi.io/jobs/<slug>`         | `api/internal-jobs` | `api/internal-jobs` | internal-job |

If the URL prefix is unrecognized, skip that URL and include it in the report under `unmatchedUrls`. Do NOT ask.

Mixed batches (some user-stories, some blog) are allowed — group per-type internally so schema inspection only runs once per type.

## Steps

### 1. Verify MCP + servers

```
mcp__strapi-local__strapi_list_servers()
```

If `source_server` or `target_server` is missing from the list → report and stop. Do not offer to install MCP — assume it's set up. If user clearly needs setup, recommend `/setup-strapi-mcp` in the final report, but still stop.

### 2. Parse URLs and group by content type

Extract `{slug, contentType, oldEndpoint, newEndpoint}` per URL. Drop unmatched. De-duplicate slugs.

### 3. Inspect local target schema (once per content type)

Read `apps/strapi/src/api/<content-type>/content-types/<content-type>/schema.json`. Capture:

- Dynamic-zone field name (usually `content`) and its allowed component UIDs
- Required top-level fields
- Relation fields and their targets (for category-like lookups)
- Media/component fields (coverImage, logoImage, seo, etc.)

### 4. Discover target category-like relations (once per content type)

For each relation field on the content type that points to a taxonomy (e.g. `case-study-category`, `blog-tag`), fetch all records from the **target** server:

```
mcp__strapi-local__strapi_rest({ server: target_server, endpoint: "api/<plural>", method: "GET", params: { pagination: { limit: 100 } } })
```

Build a `{ name → documentId }` map per relation. Use this at write time — do not hardcode documentIds. They differ across environments.

### 5. Find target documentIds for the batch (once per content type)

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

For each slug:

- **Found** → reuse `documentId`
- **Not found** → create a draft shell first via POST with minimal fields (slug + any other required non-default fields) so the agent has a documentId to write to.

Do NOT query `populate: { content: { fields: [...] } }` — it returns 500 on Strapi Cloud. Use `populate: { content: true }` or omit populate.

### 6. Slice → component mapping (the proven map)

Reuse this map as the default. It was validated on 14 records in the `case-study` migration and covers the common slice types found on old strapi.io content:

| Old component                              | Target component       | Rule                                                                                                                                                          |
| ------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------- | --- | ----------------------- |
| `slices.universal-rich-text`               | `sections.richtext`    | `{ content: richText }`                                                                                                                                       |
| `slices.large-video`                       | `media.video`          | `{ url, alignment: "center" }` — skip if `url` missing                                                                                                        |
| `slices.full-width-quote` / `slices.quote` | `testimonials.quote`   | `{ quote, authorName: author?.name                                                                                                                            |     | "Strapi", authorRole: author?.description |     | "", variant: "boxed" }` |
| `slices.interview`                         | `sections.faq-section` | `{ items: questionAnswer.filter(qa => qa.question && qa.answer).map(qa => ({ question, answer })) }`                                                          |
| `slices.text-with-key-numbers`             | `sections.richtext`    | `"## Key Numbers\n\n" + keyNumber.map(k => "- **"+k.number+"** — "+k.text).join("\n")` — skip if `keyNumber` empty                                            |
| `slices.text-slice`                        | `sections.richtext`    | Markdown from `content.label` (bold), `content.title` (H2), `content.text` — skip if all empty                                                                |
| `slices.related-case-studies`              | SKIP                   | Site renders related items algorithmically                                                                                                                    |
| anything else                              | `migration.data-sink`  | `{ sourceComponent: <old __component>, data: <full slice object> }` (requires `migration.data-sink` to be registered on target schema — else skip and report) |

**Before using the mapping:** verify each target UID is in the dynamic-zone allowlist from Step 3. If a target UID is not allowed, fall back to `migration.data-sink` (if allowed) or skip + report.

Required-field validation:

- Fragments whose required fields cannot be filled are SKIPPED (not sent with null values).
- Fragments are appended to the report's `skipped` array with a reason.

### 7. Content-length validation (lessons from the case-study run)

Several old records had SEO values that exceeded the target schema limits. Before PUT:

- Trim `seo.metaTitle` to max 60 chars (word-boundary truncate).
- Trim `seo.metaDescription` to max 160 chars.
- Check other string/text fields against `maxLength` if present in schema.

If validation still fails on PUT, retry **once** with more aggressive truncation. No further retries.

### 8. Launch one parallel agent per URL

Use the Agent tool with `general-purpose` subagent type, `run_in_background: true`, one agent per URL. All agents get the same shared context (schema map, category map, target server name, slice mapping) plus their own `{slug, contentType, targetDocumentId}`.

Each agent's prompt must contain:

1. The slice → component mapping from Step 6.
2. The `{ name → documentId }` map for each relation field from Step 4.
3. The dynamic-zone allowlist from Step 3.
4. The rule "never publish from within the agent — only update the draft."
5. The target content length limits from Step 7.
6. A strict JSON report format (see Step 10).

The agent should:

- `ToolSearch({ query: "select:mcp__strapi-local__strapi_rest,mcp__strapi-local__strapi_upload_media", max_results: 2 })` to load MCP schemas.
- GET old record: `filters[slug][$eq]=<slug>&populate=*`.
- GET target record: `api/<plural>/<documentId>?populate[content]=true&populate[seo]=true&...&status=draft`.
- Map dynamic-zone and scalar fields per rules.
- Upload cover/logo only if (old has URL) AND (target is null) — otherwise skip.
- PUT with `status=draft` and `userAuthorized=true`.
- Do **not** overwrite target title/description/companyName/coverImage/logoImage if target already has a value (prevents clobbering curated fields). Apply this rule for every field except the dynamic zone and `seo` and `originalPublishedAt`.
- Return the report JSON.

Wait on the background notifications — do NOT poll or tail the output files.

### 9. Publish (if `publish: true`, which is the default)

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

### 10. Report

One compact table plus a JSON summary. No narrative beyond one sentence.

Required report fields per URL:

- `slug`
- `documentId`
- `status` (`success` | `failed` | `skipped`)
- `oldSliceCounts`
- `newContentCounts`
- `skipped` (list of `{ reason, sliceType }`)
- `relationsAssigned` (e.g. categories)
- `mediaUploaded` (e.g. `{ coverImage: id|null, logoImage: id|null }`)
- `published` (bool)
- `error` (only if failed)

Plus a top-level `unmatchedUrls` list for URLs whose content type couldn't be detected.

## Defaults to apply (no confirmation)

- Mode: `replace` the target dynamic zone.
- Publish: yes, after successful migration.
- Media: reuse existing target media; upload from old only when target field is null AND old has a usable URL.
- Top-level scalars (title, description, companyName, etc.): only write if the target field is currently null on the new production record.
- Categories / taxonomies: resolve by name at runtime against the target server (Step 4). Drop names that don't match.
- Quotes with missing author: fill `authorName: "Strapi"` (the schema requires it). Flag in `skipped` with reason `"author fallback"` so a human can fix later.
- Related-items slices: always skip (rendered algorithmically on the frontend).
- Unknown slice types: wrap in `migration.data-sink` if registered, else skip + report.

## Non-goals

- No inline-image migration: markdown image URLs keep pointing at the old CDN. Inline image migration is out of scope because it is slow and not needed for correctness.
- No HTML scraping of strapi.io: source data comes exclusively from the old Strapi MCP's API.
- No schema changes: if a required target component is missing from the schema (e.g. `sections.faq-section` not registered), skip the fragment and report — do NOT propose schema edits. That is the `/create-content-component` skill's job.

## Example invocation

User pastes:

```
/migrate-strapi-content
https://strapi.io/user-stories/airbus
https://strapi.io/blog/state-of-js-2024
https://strapi.io/user-stories/yuka-moves-fast-with-strapi-cloud
```

Skill:

1. Parses 3 URLs, groups as `{case-study: [airbus, yuka-...], blog-post: [state-of-js-2024]}`.
2. Inspects `case-study` and `blog-post` schemas.
3. Fetches category maps for both content types.
4. Finds/creates target documentIds for all 3 slugs.
5. Launches 3 parallel agents.
6. Waits for all to complete.
7. Publishes successful ones in parallel.
8. Reports a table of 3 rows + JSON summary. No user interaction in between.
