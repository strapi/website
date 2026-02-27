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

## Execution Modes

### Autonomous mode (`caller_authorized: true`)

When invoked by another skill (e.g. `/copy-component`) with `caller_authorized: true`, this skill runs **fully autonomously**:

- **All required inputs are provided by the caller** — do not prompt for any of them.
- **Skip all approval prompts** (Step 6 preview approval, Step 9 page-exists choice).
- **Default to `append`** when a page already exists (do not ask replace/append/cancel).
- **Never use `AskUserQuestion`** — the calling skill has already obtained user intent.
- If something fails, log the error and continue. Report failures in Step 10.

### Interactive mode (default, `caller_authorized: false`)

When invoked directly by the user, prompt for missing inputs and request approval before writes.

## Inputs

| Input                   | Required | Default            | Description                                                                                           |
| ----------------------- | -------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `source_url`            | yes      | —                  | strapi.io page to scrape (e.g. `https://strapi.io/pricing`)                                           |
| `target_component`      | no       | all recognized     | specific component UID to seed (e.g. `sections.newsletter-banner`)                                    |
| `target_page_path`      | no       | derived from URL   | local page full path (e.g. `/pricing`)                                                                |
| `locale`                | yes      | `en`               | locale to seed into                                                                                   |
| `parent_page_fullPath`  | no       | derived from path  | explicit parent for nested pages                                                                      |
| `unknown_schema_policy` | no       | `best-effort fill` | how to handle unmapped fields                                                                         |
| `preExtractedContent`   | no       | —                  | `{ desktop, mobile }` structure data from `/copy-component` mega-extract. When provided, skip Step 3. |
| `caller_authorized`     | no       | `false`            | when `true`, run in autonomous mode (see above)                                                       |

In **interactive mode**, ask the user for any missing required inputs. In **autonomous mode**, derive all missing values automatically — never prompt.

## Safety Defaults

- Schema files are the source of truth, not heuristics.
- Use best-effort mapping only when type-compatible.
- Never send payloads that violate required fields or enum constraints.
- If data cannot be mapped safely, skip that fragment and report it.
- In interactive mode, show a preview and wait for explicit user approval before writing.
- In autonomous mode, log the preview but proceed without prompting.

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

Never write a `__component` UID to Strapi that the running server hasn't registered. After creating new schema files, verify registration automatically:

1. **Check Strapi is alive**: run `lsof -ti:1337`. If no process is listening, Strapi has crashed — ask the user to restart manually.
2. Run `touch apps/strapi/src/index.ts` to guarantee the file watcher triggers a restart.
3. Wait 5 seconds for the restart cycle to begin.
4. Poll `strapi_get_components` via MCP every 5s, up to 6 attempts (30s total).
5. **On each poll failure**, re-check `lsof -ti:1337`. If process died, stop polling and ask user to restart.
6. Check if the target UID appears in the component list.
7. **Found** → proceed with writes.
8. **Timeout (30s) with process alive** → fall back to asking the user to restart Strapi manually. Wait for confirmation before any MCP write operations.

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

### Step 3: Fetch or receive source page content

If `preExtractedContent` was provided in the inputs, use its `desktop` tree directly — skip fetching. The tree is a merged structure+styles tree (`{ tag, styles, text?, attrs?, children? }`) already extracted by the copy-component mega-extract and contains headings, body text, links, images, lists, and section hierarchy.

Otherwise, fetch rendered page content using the best available tool in this environment:

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
- Header schema: `apps/strapi/src/api/header/content-types/header/schema.json`
- Footer schema: `apps/strapi/src/api/footer/content-types/footer/schema.json`
- Component schemas: `apps/strapi/src/components/{category}/{name}.json`
- Nested component schemas: recursively follow `component` references.
- Optional context: `apps/strapi/src/populateDynamicZone/**/*.ts`

Build a runtime schema map that includes:

- Allowed dynamic zone component UIDs for each content type (page, header, footer).
- Field types (`string`, `text`, `richtext`, `boolean`, `integer`, `enumeration`, `media`, `relation`, `component`).
- Required flags.
- Enum allowed values.
- Relation targets.

### Step 5: Build schema-first mapping plan

Match source sections to local component UIDs by reading `docs/component-registry.md`. Use pattern matching as initial candidates only — schema validation decides final mapping.

For each extracted source section:

1. Match to a candidate local component UID.
2. Validate that UID is allowed by page `content` dynamic zone.
   - If no local component matches, skip the section and describe what was found. Suggest `/create-content-component` when a new local component is needed.
3. Map values recursively by schema:
   - Scalars: coerce conservatively and only when type-compatible.
   - Enumerations: assign only allowed values; otherwise skip and report.
   - Components: recurse into nested schema.
   - Relations: build unresolved placeholders for Step 8.
   - Media: build unresolved placeholders for Step 7.
   - Unknown or new schema fields: try best-effort mapping only when type-compatible. If not safely mappable, skip and report. Never fail the whole run for one unmapped field unless user requests strict mode.
4. Enforce required-field validity:
   - If a required field cannot be mapped, mark the component fragment as invalid, skip it, and report under `invalid`. Never fail the whole run for one invalid fragment.
5. Link rule:
   - For `utilities.link` with unresolved page relation, convert to:
     - `type: "external"`
     - `href`: absolute source URL

### Step 6: Preview and approval

Build a preview of planned operations:

- Component UIDs planned for create/update.
- Page target and locale.
- Mapping summary: `mapped`, `best_effort_mapped`, `skipped`, `invalid`, `requires_manual_followup`.
- Media URLs to upload.
- Relations to resolve/create.

**Autonomous mode**: Log the preview summary and proceed immediately to Step 7. Do NOT use `AskUserQuestion`.

**Interactive mode**: Present the preview and wait for explicit user approval before continuing.

### Step 7: Resolve media

**Never use Playwright screenshots (`browser_take_screenshot`) to capture assets.** Screenshots produce lossy raster captures that lose transparency, resolution, and SVG scalability. Always extract the original source URL from the page DOM (e.g. `img[src]`, `source[srcset]`, inline SVG `<svg>` elements, CSS `background-image` URLs) and download directly.

If a direct source URL cannot be determined (e.g. inline SVG without a file reference, canvas-rendered graphics), **skip the asset entirely** and report it in `manual_steps_needed`. Never fall back to a screenshot.

For each mapped media placeholder:

1. **Check for existing media first (reuse by name)**:
   - Derive a filename from the source URL (e.g. `https://strapi.io/assets/icons/rocket.svg` → `rocket.svg`, `rocket`).
   - Query Strapi media library: `GET /api/upload/files?filters[name][$containsi]=<filename>`.
   - If a match exists, reuse its media ID — do not re-upload.
2. **Download and upload only when no match exists**:
   - Download source asset with `curl -L` using the original source URL.
   - Upload via `strapi_upload_media()` with a descriptive `name` and `alternativeText` from the source `alt` attribute.
3. Replace placeholder with local media ID (reused or newly uploaded).

Validation rules:

- If media upload fails and field is optional, omit that field and continue.
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
- Reuse exact matches — always run find-before-create for page and relation entities to avoid duplicate plans/features/pages.
- Create only when no exact match exists.

### Step 9: Create or update content entry (locale + hierarchy safe)

Determine the target content type based on mapped components:

| Component category           | Content type | API endpoint  | Type            |
| ---------------------------- | ------------ | ------------- | --------------- |
| `sections`, `forms`, `plans` | Page         | `api/pages`   | Collection type |
| `navigation`                 | Header       | `api/headers` | Single type     |
| `footer`                     | Footer       | `api/footers` | Single type     |

#### For pages (collection type)

Do not treat `fullPath` as authored data by default.

1. Find existing page by `fullPath` and `locale`:

```text
GET /api/pages?locale=<locale>&filters[fullPath][$eq]=<targetFullPath>
```

2. If page exists:
   - **Autonomous mode**: default to `append` — add new components to existing content without prompting.
   - **Interactive mode**: ask user to choose: `replace`, `append`, or `cancel`.
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

#### For header/footer (single types)

1. GET the existing entry with full `content` populate and locale.
2. Merge new components into the existing `content` array (dynamic zone merge rule applies).
3. PUT the merged content back.
4. Single types always exist — never create, only update.

### Step 10: Report results

Report: actions taken, items created/updated/reused, items skipped/invalid, media upload results, relation reuse/create results, and any manual follow-up needed. Include page title, locale, fullPath, and documentId when available.
