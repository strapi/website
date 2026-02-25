# Batch Component Migration Workflow Design

> Date: 2026-02-25

## Problem

Two intertwined issues with the current component migration workflow:

1. **Copy-component fidelity gaps**: Style extraction sometimes misses CSS properties (backgrounds, font sizes, padding), producing layouts that need manual fixing.
2. **PRD + ralph loop for batch migration**: The prd-component skill doesn't reliably transfer user-provided URLs/XPaths into structured `copyComponentInput` fields. No mechanism exists for batching 40 components with consolidation checkpoints between groups.

## Goals

- Fix CSS extraction gaps in copy-component for higher fidelity output
- Make prd-component reliably generate copy-component stories when user provides URLs + selectors
- Support batch PRD generation from a manifest file (40 components)
- Interleave consolidation checkpoints every 3-4 components to extract reusable patterns
- Block (never manually implement) when copy-component skill can't run properly

## Non-Goals

- Pixel-perfect reproduction (standardize to design tokens, not source inconsistencies)
- Changing the ralph.sh architecture fundamentally
- Automated visual regression testing (screenshot comparison stays manual)
- Tablet breakpoints (keep desktop 1280px + mobile 375px)

## Approach

Four changes, each independent and mergeable separately.

---

## 1. Copy-component targeted patches

**File**: `.agents/skills/copy-component/SKILL.md`

### A. Extraction script CSS gaps (Steps 3-4)

Add these properties to the extraction script in Steps 3 and 4:

```javascript
// Add to styles object in extractStyles function:
backgroundImage: s.backgroundImage,
background: s.background,         // catches gradients
transform: s.transform,
transition: s.transition,
textDecoration: s.textDecoration,
textDecorationColor: s.textDecorationColor,
aspectRatio: s.aspectRatio,
objectFit: s.objectFit,
objectPosition: s.objectPosition,
```

These properties are the most likely cause of "layout correct but styles wrong" — gradients render as no background, transforms get lost.

### B. Strengthen block-on-failure

Add to the skill preamble (after line 22):

> If Playwright browser tools are unavailable, any extraction step returns empty/null data, or token mapping produces zero matches, STOP and mark the work as BLOCKED with the exact failure reason. Never fall back to screenshot-based guessing or manual CSS estimation.

### C. Clarify React generation flow

Add clarification to Step 9:

> This step creates the real styled implementation using extracted Tailwind classes. The `skip_react_component: true` passed in Step 8 only tells create-content-component to skip its basic scaffold — this step produces the actual component with extracted computed styles.

---

## 2. PRD-component skill fixes

**File**: `.agents/skills/prd-component/SKILL.md`

### A. Auto-detection rule

New section after "Component Migration Convention":

**URL/Selector auto-detection**: When the user provides a source URL (strapi.io or similar) AND a CSS selector / XPath / section identifier, this IS a copy-component story. Automatically:

1. Set `metadata.executionSkill = "copy-component"`
2. Fill `data.copyComponentInput` with the user's exact URL as `source_url` and selector as `selector`
3. Use the story description template from Component Migration Convention
4. Include the standard copy-component acceptance criteria
5. Never place URLs/selectors only in acceptance criteria or description text — they MUST appear in `data.copyComponentInput`

### B. Batch migration from manifest

New section:

When the user provides a manifest file (markdown with heading per component), generate one story per component entry:

1. Read the manifest file
2. For each component entry, create a story with `executionSkill: "copy-component"` and fill `copyComponentInput` from the manifest data
3. Every 3-4 component stories, insert a consolidation checkpoint story with `executionSkill: "consolidate-patterns"` and `dependsOn` set to the preceding batch
4. Checkpoint stories block subsequent stories so later components benefit from extracted patterns

### C. Strengthen copyComponentInput validation

Extend "Validation Rules":

If `metadata.executionSkill = "copy-component"`:

- `data.copyComponentInput` MUST exist
- `data.copyComponentInput.source_url` MUST be a non-empty URL
- `data.copyComponentInput.selector` MUST be a non-empty string
- If missing, set `loopState.status = "blocked"` with reason "Missing required copyComponentInput fields"

### D. Manifest format

Expected input format for batch migration:

```markdown
## component-name

- **URL**: https://strapi.io/page
- **Selector**: section:nth-of-type(2)
- **Variants**: https://strapi.io/other-page (same component, different content)
- **Notes**: Has dark background variant, 3-column card grid
- **Category**: sections (default if omitted)
- **Reuse mode**: balanced (default if omitted)
```

---

## 3. Consolidation checkpoint skill

**New file**: `.agents/skills/consolidate-patterns/SKILL.md`

### Purpose

Review N recently created components, identify reusable patterns, extract them to elementary components, and update the registry. Runs as a checkpoint between batches of copy-component stories.

### Workflow

1. Read the PRD to find which stories just completed (the batch before this checkpoint)
2. Read all React files created in that batch
3. Pattern detection:
   - Identical or near-identical JSX fragments across 2+ components
   - Repeated Tailwind class combinations that could be a named pattern
   - Repeated sub-component structures that should be shared elementary components
4. Extract patterns:
   - Create new elementary component in `apps/ui/src/components/elementary/`
   - Update existing components to use the new elementary component
   - Update `docs/component-registry.md`
5. Update copy-component skill references (Step 6b tables) so future components can use new atoms
6. Run quality gates (typecheck, lint)
7. Report extractions and no-ops

### Inputs (from PRD story `data`)

```yaml
batch_story_ids: ["US-001", "US-002", "US-003"]
min_occurrences: 2
```

### Constraints

- Never create elementary for a pattern appearing only once
- Never modify Strapi schemas — React-only refactoring
- Component output must be identical before/after extraction
- If no patterns found, report "no consolidation needed" and pass

---

## 4. Ralph runner fixes

**File**: `.agents/skills/prd-component/ralph.sh`

### A. Stronger block-on-skill-failure

In the `execution_skill_rule` section (~line 766), make failure states more explicit:

> If the /copy-component skill fails at any step (Playwright not available, extraction returns empty data, token mapping fails), immediately mark the story as BLOCKED with the specific failure reason. Do NOT attempt manual implementation. Do NOT guess CSS from screenshots.

### B. Support consolidate-patterns skill routing

Add an `elif` block for `consolidate-patterns` in the execution skill routing section, similar to the existing copy-component block:

```bash
elif [[ "$execution_skill" == "consolidate-patterns" ]]; then
    execution_skill_rule="MANDATORY: Read and invoke /consolidate-patterns skill with data from story payload..."
fi
```

### C. No other changes

The `dependsOn` mechanism handles checkpoint ordering. Stagnant detection, retry logic, and final review work as-is.

---

## Decisions

1. **Manifest source**: User will provide later as markdown. Exact component list TBD.
2. **Variant handling**: Extend `copyComponentInput` with `source_urls` array: `[{ url, selector, variant_name }]`. The copy-component skill visits all URLs, extracts styles from each, and merges them into a single component with a variant enumeration field. The existing `source_url` + `selector` fields remain as the primary source; `source_urls` is optional for multi-variant components.
3. **Consolidation skill depth**: React-only pattern extraction. No Strapi schema consolidation.
