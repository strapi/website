---
name: prd-component
description: "Create a structured PRD (Product Requirements Document) as a JSON task file with prioritized stories for automated execution. Ralph is the project's task runner script that processes stories sequentially. Use this skill whenever the user wants to plan work, break down a feature into stories, create a task plan, or prepare a batch of component migrations. Triggers: create PRD, plan tasks, break down work, create stories, task planning, batch migration, ralph, plan component work."
---

# PRD Intake (Generic)

Use this skill to generate `prd.json` that works for component migration, bugfixing, backend logic, or mixed work.

**Ralph** is the project's automated task runner (`.agents/skills/prd-component/ralph.sh`). It reads a PRD JSON file, iterates through stories in priority order, and executes each one by spawning Claude with the story's context and execution skill. Stories are retried up to `maxIterationsPerStory` times until acceptance criteria pass.

## Output

- Primary: `.agents/tasks/<prd-name>.json` (e.g. `.agents/tasks/prd-navbar-redesign.json`)
- Templates:
  - `.agents/skills/prd-component/assets/prd.template.json` (generic)
  - `.agents/skills/prd-component/assets/prd.template.component.json`
  - `.agents/skills/prd-component/assets/prd.template.bugfix.json`
  - `.agents/skills/prd-component/assets/prd.template.backend.json`

## Canonical Structure

Use this root contract:

```json
{
  "project": "",
  "branchName": "",
  "description": "",
  "loopConfig": {},
  "stories": [],
  "generatedAt": "",
  "status": "ready"
}
```

`stories[]` is canonical. Keep compatibility with legacy keys only when ingesting old PRDs.

Optional root constraints (recommended):

- `constraints`
- `rules`
- `nonGoals`
- `qualityGates`
- `successMetrics`
- `goals`
- `uiNotes`

These are passed into loop prompts as a global constraints context.

## loopConfig

Recommended defaults:

```json
{
  "maxIterationsPerStory": 3,
  "maxStagnantIterations": 2,
  "orderedByPriority": true,
  "memoryFile": "tmp/ralph-memory.jsonl",
  "autonomy": {
    "noQuestions": true,
    "assumeBestJudgment": true
  },
  "requiredChecks": [],
  "finalReview": {
    "enabled": true,
    "minScore": 8,
    "maxPasses": 3
  }
}
```

Notes:

- `mode` is optional metadata/context only; do not rely on it for hard validation.
- `requiredChecks` should list concrete commands/checks for the current task type.
- `autonomy.noQuestions=true` means the agent must not pause to ask clarifying questions.
- `autonomy.assumeBestJudgment=true` means ambiguous details are resolved by defaults and logged as assumptions.

## Story Shape

Each story should use:

```json
{
  "id": "US-001",
  "title": "",
  "description": "",
  "status": "open",
  "priority": 1,
  "passes": false,
  "notes": "",
  "dependsOn": [],
  "acceptanceCriteria": [],
  "loopState": {
    "phase": "queued",
    "status": "pending",
    "attempt": 0,
    "errors": []
  },
  "data": {},
  "metadata": {
    "executionSkill": ""
  }
}
```

Guidelines:

- Keep reusable, scheduler-relevant fields at the story root.
- Put domain-specific payload in `data`.
- Put operational hints/checkpoints/tags in `metadata`.
- `dependsOn`: array of story IDs that must pass before this story can run.

## Component Migration Convention

For stories that copy/migrate components from strapi.io, the `/copy-component` skill **must** be used. It contains critical extraction logic (Playwright computed styles, design token mapping, responsive diffing, reuse auditing) that cannot be replicated by ad-hoc implementation.

### Required fields

- `data.copyComponentInput` — single source of truth for `/copy-component` execution params (snake_case keys: `component_name`, `source_url`, `selector`, `prd_goal`, `content_constraints`, `reuse_mode`, `shadcn_mode`, `acceptance_profile`, `category`).
- `metadata.executionSkill = "copy-component"` — **required for deterministic skill routing**. The ralph runner uses this to inject a mandatory skill invocation instruction into the executor prompt. Without it, the LLM may attempt manual implementation.

### Story description guidance

The story `description` must explicitly reference the skill. This is what the LLM reads first and plans around:

**Good**: "Use /copy-component skill to extract, map, and generate the pricing hero section. Pass data.copyComponentInput as the intake contract."

**Bad**: "Copy the pricing hero section with simplified schema and token-mapped Tailwind." (The LLM will try to do this manually.)

### Acceptance criteria

Always include these skill-specific criteria:

- `/copy-component skill was invoked with data.copyComponentInput`
- `Computed styles were extracted via browser_evaluate (not guessed from screenshots)`
- `All CSS values are mapped to design tokens from packages/design-system/src/theme.css`
- `Populate config exists at apps/strapi/src/populateDynamicZone/{category}/{name}.ts`

### Other conventions

Do not duplicate `copyComponentInput` fields as top-level `data.*` camelCase keys — `copyComponentInput` is the authoritative execution payload.

Use `metadata.checkpoints` for restart/write/review requirements.

### URL/Selector Auto-Detection

When the user provides a source URL (e.g. `strapi.io/*`, or any URL pointing to a live website) AND a CSS selector / XPath / section identifier / section description, the story IS a copy-component migration story. Apply these rules automatically:

1. Set `metadata.executionSkill = "copy-component"`.
2. Fill `data.copyComponentInput` with the user's exact values:
   - `source_url`: the URL the user provided (verbatim)
   - `selector`: the CSS selector or XPath the user provided (verbatim)
   - `component_name`: derive from selector context or user description (kebab-case)
   - `prd_goal`: derive from user description
   - `content_constraints`: from user notes, or `"none"`
   - `reuse_mode`: from user input, default `"balanced"`
   - `shadcn_mode`: default `"prefer-existing"`
   - `acceptance_profile`: default `"balanced-default"`
   - `category`: from user input, default `"sections"`
3. If the user provides multiple URLs for the same component (variants), fill `source_urls` array in `copyComponentInput`.
4. Use the story description template from "Story description guidance" above.
5. Include the standard copy-component acceptance criteria from "Acceptance criteria" above.

**Critical**: URLs and selectors MUST appear in `data.copyComponentInput` — not only in acceptance criteria or description text. The ralph runner reads `copyComponentInput` to construct the skill invocation prompt. If the data is only in free-text fields, the skill will not receive it.

## Validation Rules

A story is runnable when:

- `id`, `title`, `priority`, `acceptanceCriteria` exist.
- `loopState.status` is not `blocked`.
- `status` (if present) is not `blocked`.
- All stories in `dependsOn` have `passes=true` (skip, don't block, if unmet).
- Required `data` for that story type is present.
- If `metadata.executionSkill = "copy-component"`:
  - `data.copyComponentInput` MUST exist.
  - `data.copyComponentInput.source_url` MUST be a non-empty URL string.
  - `data.copyComponentInput.selector` MUST be a non-empty string.
  - `data.copyComponentInput.component_name` MUST be a non-empty kebab-case string.
  - If any of these are missing or empty, the story is invalid.
- If `metadata.executionSkill = "consolidate-patterns"`:
  - `data.batch_story_ids` MUST be a non-empty array of story ID strings.
  - If missing, the story is invalid.

If invalid:

- keep story in `stories[]`
- set `loopState.status = "blocked"`
- append exact reasons to `loopState.errors`

## Batch Migration from Manifest

When the user provides a manifest file (markdown) listing multiple components to migrate, generate one PRD with all components as stories plus interleaved consolidation checkpoints.

### Manifest format

Each component is a markdown H2 heading followed by structured fields:

```markdown
## component-name

- **URL**: https://strapi.io/page
- **Selector**: section:nth-of-type(2)
- **Variants**: https://strapi.io/other-page | selector: .hero-section | variant: enterprise
- **Notes**: Has dark background variant, 3-column card grid
- **Category**: sections
- **Reuse mode**: balanced
```

Field defaults when omitted:

- **Category**: `sections`
- **Reuse mode**: `balanced`
- **Shadcn mode**: `prefer-existing`
- **Content constraints**: `none`

### Generation rules

1. **Read the manifest** and parse each H2 entry.
2. **Generate one story per component** using the Component Migration Convention format:
   - `metadata.executionSkill = "copy-component"`
   - `data.copyComponentInput` filled from manifest fields (apply URL/Selector Auto-Detection rules)
   - If **Variants** field is present, parse each variant entry and populate `source_urls` array in `copyComponentInput`
   - Story description uses the standard copy-component template
   - Include all standard copy-component acceptance criteria
3. **Insert consolidation checkpoint** every 3-4 component stories:
   - `metadata.executionSkill = "consolidate-patterns"`
   - `data.batch_story_ids` lists the IDs of the preceding 3-4 component stories
   - `data.min_occurrences = 2`
   - `dependsOn` lists all preceding component story IDs in the batch
   - Subsequent component stories `dependsOn` the checkpoint story
   - Title: `"Consolidation checkpoint: review {component names} for reusable patterns"`
   - Acceptance criteria: `["Recently created components reviewed for reusable patterns", "Any extracted elementary components pass typecheck", "docs/component-registry.md updated if new atoms created"]`
4. **Priority ordering**: Component stories in manifest order (priority 1, 2, 3, ...), checkpoint stories inserted at the appropriate priority between batches.
5. **PRD naming**: Use `prd-batch-migration-{date}.json` or user-specified name.

### Example output structure

For a manifest with 7 components (A, B, C, D, E, F, G):

| Priority | ID     | Type        | dependsOn       |
| -------- | ------ | ----------- | --------------- |
| 1        | US-001 | Component A | []              |
| 2        | US-002 | Component B | []              |
| 3        | US-003 | Component C | []              |
| 4        | US-004 | Checkpoint  | [001, 002, 003] |
| 5        | US-005 | Component D | [004]           |
| 6        | US-006 | Component E | [004]           |
| 7        | US-007 | Component F | [004]           |
| 8        | US-008 | Checkpoint  | [005, 006, 007] |
| 9        | US-009 | Component G | [008]           |
| 10       | US-010 | Checkpoint  | [009]           |

## Guardrails

- **One file per session**: All features discussed in a single planning session go into **one PRD file** under `.agents/tasks/`. Never split related work into multiple PRD files — use `dependsOn` in stories to express ordering.
- **Naming convention**: Use `prd-<kebab-case-name>.json` (e.g. `prd-navbar-redesign.json`, `prd-auth-flow.json`).
- **Append to existing PRDs**: If a PRD file already exists at the target path, read it first and **append** new stories (continuing the ID sequence). Merge top-level arrays (goals, nonGoals, rules, etc.) — do not overwrite existing entries.
- One story should map to one coherent unit of work.
- Keep IDs stable for retry idempotency.
- Never hide blockers; write them to `loopState.errors` and `notes`.
- Prefer explicit checks in `loopConfig.requiredChecks` over implicit assumptions.
- Default loop posture is autonomous: no user Q&A mid-run, assumptions logged instead.

## See Also

- `.agents/skills/prd-component/ralph.sh`
- `.agents/skills/copy-component/SKILL.md`
- `.agents/skills/create-content-component/SKILL.md`
- `.agents/skills/seed-content/SKILL.md`
