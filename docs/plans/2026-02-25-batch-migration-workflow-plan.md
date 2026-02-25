# Batch Migration Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix copy-component CSS extraction gaps, make prd-component reliably generate copy-component stories from URLs/XPaths, add batch manifest support with consolidation checkpoints, and strengthen ralph's skill routing.

**Architecture:** Four independent changesets to existing skill files (`.agents/skills/`), plus one new skill (`consolidate-patterns`). No application code changes — all modifications are to AI skill definitions and the ralph runner script.

**Tech Stack:** Markdown (skill definitions), Bash (ralph.sh), JSON (PRD templates)

**Design doc:** `docs/plans/2026-02-25-batch-migration-workflow-design.md`

---

### Task 1: Copy-component — extend CSS extraction scripts

**Files:**

- Modify: `.agents/skills/copy-component/SKILL.md:154-217` (Steps 3-4 extraction scripts)

**Step 1: Add missing CSS properties to the Step 3 extraction script**

In `.agents/skills/copy-component/SKILL.md`, find the `styles:` object inside the Step 3 `extractStyles` function (line ~168). After the `// Visual` block (ending with `position: s.position`), add:

```javascript
        // Background details
        backgroundImage: s.backgroundImage,
        background: s.background,
        // Transform & transitions
        transform: s.transform,
        transition: s.transition,
        // Text decoration
        textDecoration: s.textDecoration,
        textDecorationColor: s.textDecorationColor,
        // Object/aspect
        aspectRatio: s.aspectRatio,
        objectFit: s.objectFit,
        objectPosition: s.objectPosition,
```

The `styles` object on line ~168 currently ends with `position: s.position,` — insert the new block right after, before the closing `},`.

**Step 2: Verify Step 4 references Step 3**

Step 4 says "Re-run the same extraction script from Step 3" (line ~223). No code change needed — it inherits the updated script. Confirm this is still the case (no separate copy of the script in Step 4).

**Step 3: Commit**

```bash
git add .agents/skills/copy-component/SKILL.md
git commit -m "fix(copy-component): add background, transform, text-decoration to CSS extraction"
```

---

### Task 2: Copy-component — strengthen block-on-failure and clarify React flow

**Files:**

- Modify: `.agents/skills/copy-component/SKILL.md:22` (preamble failure rule)
- Modify: `.agents/skills/copy-component/SKILL.md:486-488` (Step 9 clarification)

**Step 1: Strengthen block-on-failure in preamble**

Find line 22:

```markdown
If Playwright browser tools are unavailable, stop and tell the user this skill cannot run reliably without computed-style extraction.
```

Replace with:

```markdown
**Fail-safe rule**: If Playwright browser tools are unavailable, any extraction step (Steps 2-4) returns empty or null data, or token mapping (Step 6) produces zero matches, STOP immediately and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing, manual CSS estimation, or ad-hoc implementation. The value of this skill is deterministic computed-style extraction — without it, the output is unreliable and should not be produced.
```

**Step 2: Clarify React generation flow in Step 9**

Find line 486-488:

```markdown
### Step 9: Generate React component

Create the React component at the path established in Step 8 (schema scaffolding skipped React via `skip_react_component: true`). Use extracted Tailwind classes for a real implementation. Follow patterns from existing components:
```

Replace with:

```markdown
### Step 9: Generate React component

Create the real styled React implementation using extracted Tailwind classes from Steps 3-6. The `skip_react_component: true` passed to create-content-component in Step 8 only tells that skill to skip its basic scaffold — THIS step produces the actual component with computed-style-derived classes. Follow patterns from existing components:
```

**Step 3: Commit**

```bash
git add .agents/skills/copy-component/SKILL.md
git commit -m "fix(copy-component): strengthen block-on-failure, clarify React generation flow"
```

---

### Task 3: Copy-component — add source_urls for multi-variant components

**Files:**

- Modify: `.agents/skills/copy-component/SKILL.md:36-69` (intake contract section)

**Step 1: Extend the intake contract YAML**

Find the contract block (line ~36-46). After `category: <optional; defaults to sections>`, add:

```yaml
source_urls: <optional; array of {url, selector, variant_name} for multi-variant components>
```

**Step 2: Add validation rule for source_urls**

After line 54 (`category` defaults), add:

```markdown
- `source_urls` is optional. When provided, it's an array of objects with `url` (required), `selector` (required), and `variant_name` (required) fields. Each entry represents a visual variant of the same component found on a different page.
- When `source_urls` is provided, the skill must visit each URL, extract styles for each variant, and merge them into a single component with a `variant` enumeration field. The `source_url` + `selector` fields serve as the primary/default variant.
```

**Step 3: Add camelCase normalization**

After the existing camelCase compatibility list (line ~65), add:

```markdown
- `sourceUrls` -> `source_urls`
```

**Step 4: Commit**

```bash
git add .agents/skills/copy-component/SKILL.md
git commit -m "feat(copy-component): add source_urls for multi-variant components"
```

---

### Task 4: PRD-component — add URL/selector auto-detection rule

**Files:**

- Modify: `.agents/skills/prd-component/SKILL.md:115-146` (after Component Migration Convention)

**Step 1: Add auto-detection section**

After line 146 (`Use metadata.checkpoints for restart/write/review requirements.`), before the `## Validation Rules` heading, insert:

```markdown
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
```

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/SKILL.md
git commit -m "feat(prd-component): add URL/selector auto-detection for copy-component stories"
```

---

### Task 5: PRD-component — strengthen copyComponentInput validation

**Files:**

- Modify: `.agents/skills/prd-component/SKILL.md:148-164` (Validation Rules section)

**Step 1: Extend validation rules**

Find line 157:

```markdown
- If `metadata.executionSkill = "copy-component"`, `data.copyComponentInput` is present.
```

Replace with:

```markdown
- If `metadata.executionSkill = "copy-component"`:
  - `data.copyComponentInput` MUST exist.
  - `data.copyComponentInput.source_url` MUST be a non-empty URL string.
  - `data.copyComponentInput.selector` MUST be a non-empty string.
  - `data.copyComponentInput.component_name` MUST be a non-empty kebab-case string.
  - If any of these are missing or empty, the story is invalid.
- If `metadata.executionSkill = "consolidate-patterns"`:
  - `data.batch_story_ids` MUST be a non-empty array of story ID strings.
  - If missing, the story is invalid.
```

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/SKILL.md
git commit -m "fix(prd-component): strengthen copyComponentInput validation rules"
```

---

### Task 6: PRD-component — add batch manifest migration section

**Files:**

- Modify: `.agents/skills/prd-component/SKILL.md` (new section before Guardrails)

**Step 1: Add batch migration section**

Before the `## Guardrails` heading (line ~165), insert:

```markdown
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
```

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/SKILL.md
git commit -m "feat(prd-component): add batch manifest migration section with consolidation checkpoints"
```

---

### Task 7: PRD-component template — add component migration template variant fields

**Files:**

- Modify: `.agents/skills/prd-component/assets/prd.template.component.json`

**Step 1: Add source_urls to template copyComponentInput**

Read the template file. In the `data.copyComponentInput` object, add the `source_urls` field:

```json
"source_urls": []
```

This is an empty array by default. When a component has variants, the PRD generator fills it with `[{ "url": "...", "selector": "...", "variant_name": "..." }]`.

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/assets/prd.template.component.json
git commit -m "feat(prd-template): add source_urls field to component migration template"
```

---

### Task 8: Create consolidate-patterns skill

**Files:**

- Create: `.agents/skills/consolidate-patterns/SKILL.md`

**Step 1: Write the skill file**

Create `.agents/skills/consolidate-patterns/SKILL.md` with this content:

````markdown
---
name: consolidate-patterns
description: "Review recently created page-builder components, identify reusable JSX/Tailwind patterns, extract them into elementary components, and update the component registry. Use as a checkpoint between batches of copy-component migrations. Triggers: consolidate patterns, extract reusable, review components for patterns, checkpoint review."
---

# Consolidate Patterns

Review recently created components, identify reusable patterns that appear in 2+ components, extract them into shared elementary components, and update references.

**Scope**: React-only refactoring. Never modify Strapi schemas.

## Prerequisites

- Recently created page-builder component files exist
- `docs/component-registry.md` is current
- `apps/ui/src/components/elementary/` exists

## Inputs

From PRD story `data`:

```yaml
batch_story_ids: ["US-001", "US-002", "US-003"] # story IDs to review
min_occurrences: 2 # pattern must appear in N+ components
```

If `batch_story_ids` is empty or missing, BLOCK the story — nothing to review.

## Steps

### Step 1: Identify files from batch

1. Read the PRD file to find completed stories matching `batch_story_ids`.
2. For each story, find the React component file path from the story's `data.copyComponentInput.component_name` and `category`, using the naming convention: `apps/ui/src/components/page-builder/components/{category}/Strapi{PascalCase}.tsx`
3. Read each file in full.

### Step 2: Detect repeated patterns

Analyze the components for these pattern types:

1. **Identical JSX structures** — same element hierarchy (e.g. `div > SectionLabel + SectionHeading + SectionDescription`) appearing in 2+ components with only content/className differences.
2. **Repeated Tailwind class groups** — same combination of layout + spacing + visual classes applied to structurally similar elements across components (e.g. `flex flex-col items-center text-center gap-4 py-16`).
3. **Repeated sub-component compositions** — same combination of elementary components used together (e.g. icon + title + description card pattern).

For each detected pattern, record:

- Which components contain it
- The JSX fragment / class group
- How many times it appears
- A proposed elementary component name

### Step 3: Filter by min_occurrences

Discard any pattern appearing fewer than `min_occurrences` times. If no patterns remain, report "No consolidation needed — all patterns are unique or appear only once" and mark the story as passed.

### Step 4: Extract elementary components

For each remaining pattern:

1. Create a new elementary component at `apps/ui/src/components/elementary/{ComponentName}.tsx`.
2. Follow existing elementary component conventions:
   - Accept `className` prop merged via `cn()`
   - Use `data-slot` attribute
   - Accept `children` or specific typed props
   - Use CVA variants only when needed
3. Update all source components to import and use the new elementary component.
4. Verify that the rendered output is identical (same HTML structure, same classes).

### Step 5: Update registry

1. Update `docs/component-registry.md` → "React Elementary Components" table with new entries.
2. Update `.agents/skills/copy-component/SKILL.md` Step 6b and Step 6d tables if the new elementary component is a pattern future components should use (e.g. a new section header variant, a new card layout).

### Step 6: Quality gates

Run:

```bash
cd apps/ui && pnpm typecheck
pnpm lint
```

If either fails, fix the issues before proceeding.

### Step 7: Commit and report

```bash
git add apps/ui/src/components/elementary/ apps/ui/src/components/page-builder/ docs/component-registry.md
git commit -m "refactor: extract reusable patterns from batch {story_ids}"
```

Report:

- Patterns detected (with occurrence count)
- Elementary components created (with file paths)
- Components updated to use new patterns
- Patterns skipped (below threshold)

## Constraints

- Never create an elementary component for a pattern appearing only once
- Never modify Strapi schemas — this is React-only refactoring
- Component rendered output must be identical before and after extraction
- If no patterns are found, report and pass — this is not a failure
- Do not create overly abstract components — the elementary should be a direct extraction of the repeated JSX, not a generalized framework
````

**Step 2: Commit**

```bash
git add .agents/skills/consolidate-patterns/SKILL.md
git commit -m "feat: add consolidate-patterns skill for batch migration checkpoints"
```

---

### Task 9: Ralph runner — add consolidate-patterns skill routing

**Files:**

- Modify: `.agents/skills/prd-component/ralph.sh:785` (after copy-component elif block)

**Step 1: Add consolidate-patterns routing block**

Find line 785 (after the `fi` closing the copy-component block). Before the next `if` statement about REQUIRED_CHECKS (~line 787), insert:

```bash
  elif [[ "$execution_skill" == "consolidate-patterns" ]]; then
    execution_skill_rule=$(cat <<SKILL_RULE

MANDATORY SKILL ROUTING — READ THIS FIRST:
   This story REQUIRES the /consolidate-patterns skill. Do NOT implement manually.
   The skill reviews recently created components for reusable patterns and extracts elementary components.

   STEP 1: Read .agents/skills/consolidate-patterns/SKILL.md
   STEP 2: Invoke /consolidate-patterns with the story's data payload:
   - batch_story_ids: from data.batch_story_ids
   - min_occurrences: from data.min_occurrences (default 2)
   STEP 3: Follow the skill's output — extract patterns it identifies, skip if none found.

   If the skill is unavailable, mark the story as BLOCKED — do not attempt manual pattern extraction.
SKILL_RULE
)
```

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/ralph.sh
git commit -m "feat(ralph): add consolidate-patterns skill routing"
```

---

### Task 10: Ralph runner — strengthen block-on-failure wording

**Files:**

- Modify: `.agents/skills/prd-component/ralph.sh:766-784` (copy-component skill rule)

**Step 1: Strengthen the failure instruction**

Find the existing copy-component SKILL_RULE block (line ~766-784). Replace the last line before `SKILL_RULE`:

```
   If the skill fails or is unavailable, mark the story as BLOCKED — do not fall back to manual implementation.
```

With:

```
   If the skill fails or is unavailable, mark the story as BLOCKED — do not fall back to manual implementation.
   Specific failure states that MUST trigger BLOCKED:
   - Playwright browser tools not available or browser_navigate/browser_evaluate fail
   - Extraction steps return empty/null data (no computed styles extracted)
   - Token mapping produces zero design-token matches
   - Required CSS properties (font-size, background-color, padding) missing from extraction
   Do NOT guess CSS values from screenshots. Do NOT write manual Tailwind classes without extraction data.
```

**Step 2: Commit**

```bash
git add .agents/skills/prd-component/ralph.sh
git commit -m "fix(ralph): specify copy-component failure states that trigger BLOCKED"
```

---

### Task 11: Verify all changes and final commit

**Files:**

- All modified files from Tasks 1-10

**Step 1: Review all changed files**

```bash
git log --oneline -10
git diff HEAD~10..HEAD --stat
```

Verify 4 files modified, 1 file created:

- `.agents/skills/copy-component/SKILL.md` — CSS extraction + block-on-failure + React clarification + source_urls
- `.agents/skills/prd-component/SKILL.md` — auto-detection + validation + batch manifest
- `.agents/skills/prd-component/assets/prd.template.component.json` — source_urls field
- `.agents/skills/prd-component/ralph.sh` — consolidate-patterns routing + stronger block wording
- `.agents/skills/consolidate-patterns/SKILL.md` — new file

**Step 2: Verify ralph.sh still runs**

```bash
bash -n .agents/skills/prd-component/ralph.sh
```

Expected: no syntax errors (exit 0).

**Step 3: Verify no broken markdown links in skills**

```bash
grep -r 'skills/copy-component' .agents/skills/ --include='*.md' | head -20
grep -r 'skills/consolidate-patterns' .agents/skills/ --include='*.md' | head -20
grep -r 'skills/create-content-component' .agents/skills/ --include='*.md' | head -20
```

Verify all cross-references point to existing files.
