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

```yaml
components: ["StrapiPricingHero", "StrapiFeatureGrid", "StrapiTestimonials"] # component names or file paths
min_occurrences: 2 # pattern must appear in N+ components (default: 2)
```

Resolve names to file paths using the naming convention: `apps/ui/src/components/page-builder/components/**/**/Strapi{Name}.tsx`. If paths are provided directly, use them as-is.

If `components` is not provided, fall back to scanning recent git history:

1. Run `git log --oneline --diff-filter=A --name-only -20 -- 'apps/ui/src/components/page-builder/components/**/Strapi*.tsx'`
2. Use the resulting file list as input.
3. If no recent component files found, report "No components to review" and stop.

## Steps

### Step 1: Identify files

1. Resolve component names/paths to absolute file paths as described in Inputs. If no components provided, use the git fallback.
2. Read each file in full.

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

Discard any pattern appearing fewer than `min_occurrences` times. If no patterns remain, report "No consolidation needed — all patterns are unique or appear only once" and stop.

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

### Step 6: Update component library page

Add examples of each new elementary component to the dev component library at `apps/ui/src/app/[locale]/dev/component-library/page.tsx`.

For each extracted elementary component:

1. Read the current component library page file.
2. **Import** the new elementary component (keep imports grouped with other elementary components).
3. **Add a TOC entry**: append `{ id: "{kebab-case-name}", label: "{ComponentName}" }` to the `TOC` array.
4. **Add a `<Section>` block** at the end (before the closing `</div>`):

```tsx
<Section id="{kebab-case-name}" title="{ComponentName}">
  <div className="space-y-6">
    <Variant label="Default">
      <ComponentName>Example content</ComponentName>
    </Variant>
  </div>
</Section>
```

5. If the component has CVA variants, sizes, or layout props, add a `<Variant>` block for each, following the existing patterns in the file (e.g. mapping over variant values, showing each in a bordered card).
6. Use the `<Placeholder>` helper for image slots.

Skip silently if the component library page file doesn't exist.

### Step 7: Quality gates

Run:

```bash
cd apps/ui && pnpm typecheck
pnpm lint
```

If either fails, fix the issues before proceeding.

### Step 8: Commit and report

```bash
git add apps/ui/src/components/elementary/ apps/ui/src/components/page-builder/ docs/component-registry.md apps/ui/src/app/\[locale\]/dev/component-library/
git commit -m "refactor: extract reusable patterns from {component_names}"
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
