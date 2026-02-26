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
