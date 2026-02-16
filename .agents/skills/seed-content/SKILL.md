---
name: seed-content
description: "Scrape a strapi.io page, extract content for specific components, transform to match local Strapi schemas, and seed into local Strapi via MCP. Schema-driven and resilient to evolving schemas. Triggers: seed content, scrape strapi, import content, seed page, seed component."
---

# Seed Content from strapi.io

Scrape a strapi.io page, extract content, map it to local Strapi schemas, and seed it into the local Strapi instance via MCP.

This workflow is intentionally adaptive. Local schemas evolve, so the skill must discover schema shape at runtime and avoid hardcoded assumptions.

## Prerequisites

- Strapi MCP server is configured. Verify with `strapi_list_servers()`.
- If MCP is not configured, tell the user to run `/setup-strapi-mcp` first and stop.
- Strapi is running locally at `http://localhost:1337`.
- User approves write operations before any create/update calls.

## Inputs

Ask the user for:

1. **Source URL** (required): strapi.io page to scrape, for example `https://strapi.io/pricing`.
2. **Target component** (optional): specific component UID to seed, for example `sections.hero`. If omitted, seed all recognized sections.
3. **Target page path** (optional): local page full path, for example `/pricing`. If omitted, derive from source URL path.
4. **Locale** (required): locale to seed into, for example `en`.
5. **Parent page fullPath** (optional): explicit parent for nested pages. If omitted, derive from target page path.
6. **Unknown schema policy** (optional): default to `best-effort fill` unless user asks for stricter behavior.

## Safety Defaults

- Schema files are the source of truth, not heuristics.
- Use best-effort mapping only when type-compatible.
- Never send payloads that violate required fields or enum constraints.
- If data cannot be mapped safely, skip that fragment and report it.
- Always show a preview and wait for explicit user approval before writing.

### Dynamic zone merge rule (CRITICAL)

Strapi PUT requests **replace** the entire field value. Sending `"content": [{ new }]` will **delete all existing components** on that page.

**Always GET the page with full `content` populate first, then append new components to the existing array before PUT.**

```
// WRONG — wipes existing content
PUT { "data": { "content": [{ "__component": "sections.new", ... }] } }

// RIGHT — preserves existing
GET → content = [{ existing1 }, { existing2 }]
PUT { "data": { "content": [{ existing1 }, { existing2 }, { "__component": "sections.new", ... }] } }
```

### Schema registration rule (CRITICAL)

Never write a `__component` UID to Strapi that the running server hasn't registered. After creating new schema files, ask the user to restart Strapi and wait for confirmation before any MCP write operations.

## Steps

### Step 1: Verify MCP setup

Call `strapi_list_servers()`:

- If call fails or Strapi MCP tools are unavailable, tell user to run `/setup-strapi-mcp` and stop.
- If call succeeds, continue.

### Step 2: Verify local Strapi availability

Check if port 1337 is in use (`lsof -ti:1337`), then verify Strapi responds:

- Prefer `GET /api/health` and expect `200`.
- If unavailable, fall back to checking `http://localhost:1337/admin`.
- If Strapi is not running, ask the user to start it in a separate terminal and wait for confirmation. **Never launch dev servers in the background.**

### Step 3: Fetch source page content

Fetch rendered page content using the best available tool in this environment:

- Primary: Web fetch of HTML.
- Fallback: browser automation snapshot for JavaScript-rendered layouts.

Extract:

- Headings, body text, labels, and descriptions.
- Links (label + href + new tab hints).
- Image URLs and alt text.
- List/card/table structures.
- Section boundaries and hierarchy.

### Step 4: Read local schemas (recursive)

Read schema definitions before mapping:

- Page schema: `apps/strapi/src/api/page/content-types/page/schema.json`
- Component schemas: `apps/strapi/src/components/{category}/{name}.json`
- Nested component schemas: recursively follow `component` references.
- Optional context: `apps/strapi/src/populateDynamicZone/**/*.ts`

Build a runtime schema map that includes:

- Allowed dynamic zone component UIDs.
- Field types (`string`, `text`, `richtext`, `boolean`, `integer`, `enumeration`, `media`, `relation`, `component`).
- Required flags.
- Enum allowed values.
- Relation targets.

### Step 5: Build schema-first mapping plan

For each extracted source section:

1. Match to a candidate local component UID (heuristics are allowed but non-authoritative).
2. Validate that UID is allowed by page `content` dynamic zone.
3. Map values recursively by schema:
   - Scalars: coerce conservatively and only when type-compatible.
   - Enumerations: assign only allowed values; otherwise skip and report.
   - Components: recurse into nested schema.
   - Relations: build unresolved placeholders for Step 8.
   - Media: build unresolved placeholders for Step 7.
4. Enforce required-field validity:
   - If required field cannot be mapped, mark component fragment as invalid.
   - Invalid fragments are skipped and reported.
5. Link rule:
   - For `utilities.link` with unresolved page relation, convert to:
     - `type: "external"`
     - `href`: absolute source URL

### Step 6: Preview and request approval

Before any write operation, present:

- Component UIDs planned for create/update.
- Page target and locale.
- Mapping summary:
  - `mapped`
  - `best_effort_mapped`
  - `skipped`
  - `invalid`
  - `requires_manual_followup`
- Media URLs to upload.
- Relations to resolve/create.

Wait for explicit user approval.

### Step 7: Resolve media

For each mapped media placeholder:

1. Download source asset with `curl -L`.
2. Upload via `strapi_upload_media()`.
3. Replace placeholder with local media ID.

Validation rules:

- If media upload fails and field is optional, omit that field and report.
- If media upload fails and field is required, do not write `null`.
  - Skip the containing component fragment.
  - Add item to `invalid` and `requires_manual_followup`.

### Step 8: Resolve relations with deterministic order and dedupe

Resolve dependencies bottom-up with find-before-create:

1. `api::plan-feature.plan-feature`
2. `api::plan.plan`
3. Components that reference plans/features
4. Page entry

Dedupe keys (default guidance):

- Plan feature: `name + category (+ locale when localized)`
- Plan: `name + type + locale`
- Page: `fullPath + locale`

Rules:

- Query existing records first via `strapi_rest()` GET.
- Reuse exact matches.
- Create only when no exact match exists.

### Step 9: Create or update page (locale + hierarchy safe)

Do not treat `fullPath` as authored data by default.

1. Find existing page by `fullPath` and `locale`:

```text
GET /api/pages?locale=<locale>&filters[fullPath][$eq]=<targetFullPath>
```

2. If page exists:
   - Ask user to choose:
     - `replace` existing dynamic zone content
     - `append` new components
     - `cancel`
3. If page does not exist:
   - Derive `slug` from target path.
   - Resolve parent page from `parentFullPath` or derived parent path (same locale).
   - Create using `slug`, optional `parent` relation, `content`, and `status: "published"`.
   - Avoid writing `fullPath` directly unless user explicitly requests it and confirms hierarchy automation is disabled.

4. After write:
   - Re-fetch by `documentId` + `locale`.
   - Verify expected `fullPath`.
   - If `fullPath` is missing/stale because internal jobs are pending, report manual follow-up:
     - In Strapi admin, run `Recalculate all fullpaths`.
     - Run `Create all redirects` only when redirects are desired.

### Step 10: Report results

Always return the final structured report:

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
  "manual_steps_needed": []
}
```

Include:

- Page info: `title`, `locale`, `fullPath`, `documentId`.
- Component list with brief summaries.
- Media upload results.
- Relation reuse/create results.
- Preview URL and admin URL when available.

## Edge Cases

### Unknown or new schema fields

- Try best-effort mapping only when type-compatible.
- If not safely mappable, skip and report.
- Never fail the whole run for one unmapped field unless user requests strict mode.

### Unknown components on source page

- Skip unrecognized sections and describe what was found.
- Suggest `/create-content-component` when a new local component is needed.

### Required data missing

- If required fields cannot be mapped, skip affected fragment and report it under `invalid`.

### Missing images

- Optional media fields: omit field and continue.
- Required media fields: skip affected component fragment and report manual follow-up.

### Duplicate content

- Always run find-before-create for page and relation entities.
- Reuse exact matches to avoid duplicate plans/features/pages.

### Links with page relations

- Convert unresolved `type: "page"` links to `type: "external"` with absolute source URL.

## Component Matching Heuristics (non-authoritative)

Use these patterns only as initial candidates. Schema validation decides final mapping.

| Source pattern                  | Local component                    |
| ------------------------------- | ---------------------------------- |
| Hero section with heading + CTA | `sections.hero`                    |
| FAQ / accordion section         | `sections.faq`                     |
| Image carousel / slider         | `sections.carousel`                |
| Logo row / partner logos        | `sections.animated-logo-row`       |
| Pricing cards with plans        | `plans.plan-pricing-cards`         |
| Feature comparison table        | `plans.plan-comparison-table`      |
| Newsletter signup form          | `forms.newsletter-form`            |
| Contact form                    | `forms.contact-form`               |
| Heading with CTA button         | `sections.heading-with-cta-button` |
| Image with CTA button           | `sections.image-with-cta-button`   |
| Horizontal image gallery        | `sections.horizontal-images`       |
