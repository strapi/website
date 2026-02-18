---
name: prd-component
description: "Create a flexible camelCase PRD JSON for Ralph loops with generic stories[] plus optional domain-specific data/metadata blocks."
---

# PRD Intake (Generic)

Use this skill to generate `prd.json` that works for component migration, bugfixing, backend logic, or mixed work.

## Output

- Primary: `prd.json` at repo root
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

## loopConfig

Recommended defaults:

```json
{
  "maxIterationsPerStory": 3,
  "maxStagnantIterations": 2,
  "stopOnBlockedCheckpoint": true,
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

For component stories, use:

- `data.copyComponentInput` — single source of truth for `copy-component` execution params (snake_case keys: `component_name`, `source_url`, `selector`, `prd_goal`, `content_constraints`, `reuse_mode`, `shadcn_mode`, `acceptance_profile`, `category`).
- `metadata.executionSkill = "copy-component"` (required for deterministic skill routing)

Do not duplicate `copyComponentInput` fields as top-level `data.*` camelCase keys — `copyComponentInput` is the authoritative execution payload.

Use `metadata.checkpoints` for restart/write/review requirements.

## Validation Rules

A story is runnable when:

- `id`, `title`, `priority`, `acceptanceCriteria` exist.
- `loopState.status` is not `blocked`.
- All stories in `dependsOn` have `passes=true` (skip, don't block, if unmet).
- Required `data` for that story type is present.
- If `metadata.executionSkill = "copy-component"`, `data.copyComponentInput` is present.

If invalid:

- keep story in `stories[]`
- set `loopState.status = "blocked"`
- append exact reasons to `loopState.errors`

## Guardrails

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
