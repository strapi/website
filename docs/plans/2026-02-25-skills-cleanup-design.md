# Skills Cleanup Design

## Problem

8 skills totaling ~2,400 lines with:

- Cross-contamination: PRD skill embeds copy-component validation, acceptance criteria, execution routing
- Duplication: dynamic zone tables, naming conventions, duplicate check logic appear in multiple skills
- PRD/ralph artifacts: caller contracts, structured result JSON, communication flags (`seed_payload_ready`, `requires_restart`, `acceptance_profile`) litter active skills
- Static data inline: JS extraction scripts, mapping tables, icon lists inflate skill word count

## Decision

**Approach B: Prune + compress** — remove PRD/ralph artifacts from active skills, extract static data to reference files, eliminate duplication via single-source-of-truth pattern.

Leave `prd-component`, `consolidate-patterns`, `ralph.sh`, and `.agents/tasks/` untouched.

## Changes by skill

### copy-component (731 → ~300 lines)

#### Extract to reference files

- `references/extraction-scripts.js` — browser_evaluate scripts from Steps 2, 3, 4 (~70 lines of JS)
- `references/component-mapping.md` — Typography variant table, Link/CTA/Image mapping, Shadcn pattern table, Composition patterns (~85 lines)
- Keep existing `references/token-mapping.md` as-is

#### Remove duplication with create-content-component

- Dynamic zone level table — reference create-content-component instead of duplicating
- Naming conventions — reference create-content-component
- Duplicate check logic (Checks A-D) — reference create-content-component

#### Remove PRD artifacts

- Drop `acceptance_profile` from intake contract and all references
- Drop `seed_payload_ready`, `requires_restart` from structured result
- Drop camelCase normalization rules (was for PRD caller)
- Drop the YAML handoff contract to create-content-component (Step 8) — use natural language delegation
- Drop structured JSON result template (Step 13) — skill reports in prose

#### Compress

- Intake contract validation: checklist instead of verbose rules
- Step 12b review loop: 30 → ~10 lines
- Edge cases: 40 → ~15 lines
- Section targeting: merge into Step 1

### create-content-component (462 → ~250 lines)

#### Becomes canonical source for

- Dynamic zone level table
- Naming conventions
- Duplicate check logic (Checks A-D)
- Component reuse rules

#### Remove PRD artifacts

- Drop "Caller Contract" section (lines 126-157)
- Drop `skip_react_component` flag references
- Drop structured result JSON (Step 9)

#### Extract to reference files

- Icon list → `references/strapi-icons.txt`

#### Compress

- Populate config (Step 4): 3 code examples → 1 + decision tree, ~60 → ~30 lines
- React component template (Step 5): remove anti-pattern warnings, tighten

### seed-content (305 → ~180 lines)

- Drop structured result JSON (Step 10)
- Drop component matching heuristics table (stale data — registry is runtime source)
- Merge edge cases into relevant steps instead of separate section

### shadcn-ui (91 → ~65 lines)

- Drop "Parent Skill Contract" section (PRD/caller contract pattern)

### setup-strapi-mcp (189 → ~175 lines)

- Drop structured result JSON (Step 8)

### add-locale (77 → 77 lines)

- No changes

### Untouched

- prd-component (273 lines)
- consolidate-patterns (105 lines)

## New reference files

| File                                                   | Contents                                                                           | Loaded by                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------- |
| `copy-component/references/extraction-scripts.js`      | browser_evaluate JS for structure + style extraction                               | copy-component Steps 2-4        |
| `copy-component/references/component-mapping.md`       | Typography variants, Link/CTA/Image mapping, Shadcn patterns, Composition patterns | copy-component Step 6b-6d       |
| `create-content-component/references/strapi-icons.txt` | Available Strapi component icons, one per line                                     | create-content-component Step 2 |

## Estimated impact

| Skill                    | Before    | After      | Reduction |
| ------------------------ | --------- | ---------- | --------- |
| copy-component SKILL.md  | 731       | ~300       | -431      |
| create-content-component | 462       | ~250       | -212      |
| seed-content             | 305       | ~180       | -125      |
| shadcn-ui                | 91        | ~65        | -26       |
| setup-strapi-mcp         | 189       | ~175       | -14       |
| **Active skills total**  | **1,855** | **~1,047** | **~44%**  |

Reference files absorb ~250 lines of extracted content — but these are loaded on demand, not front-loaded into the AI's context for every invocation.

## Risks

- Extracting JS to reference files means the AI must read the file before using the scripts — add explicit "Read `references/extraction-scripts.js`" instruction
- Removing structured JSON results means the AI reports in prose — acceptable since ralph doesn't consume these anymore
- Single-source-of-truth references (copy-component → create-content-component) add a dependency — if create-content-component is not loaded, copy-component must still work. Mitigation: copy-component says "see create-content-component for X" as context, not as a runtime dependency
