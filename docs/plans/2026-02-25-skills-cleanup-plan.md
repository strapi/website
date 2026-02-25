# Skills Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove PRD/ralph artifacts, extract static data to reference files, eliminate duplication across skills — ~44% reduction in active skill line count.

**Architecture:** Bottom-up — create reference files first, then rewrite skills that depend on them, starting with the canonical source (create-content-component) before dependents (copy-component).

**Tech Stack:** Markdown, JavaScript (extraction scripts), plain text (icon list)

**Design doc:** `docs/plans/2026-02-25-skills-cleanup-design.md`

---

### Task 1: Create extraction scripts reference file

**Files:**

- Create: `.agents/skills/copy-component/references/extraction-scripts.js`

**Step 1: Extract JS blocks from copy-component SKILL.md**

Read `copy-component/SKILL.md` lines 113-141 (structure extraction), lines 158-234 (style extraction), and the cookie banner dismissal (lines 686-700) and lazy-load scroll (lines 704-709).

Create `.agents/skills/copy-component/references/extraction-scripts.js` with these functions as named exports/comments:

```javascript
// Structure extraction — use with browser_evaluate on target section element (Step 2)
function extractStructure(el, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return null

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  return {
    tag: el.tagName.toLowerCase(),
    text,
    attrs: {
      href: el.getAttribute("href"),
      src: el.getAttribute("src"),
      alt: el.getAttribute("alt"),
      role: el.getAttribute("role"),
      type: el.getAttribute("type"),
    },
    childCount: el.children.length,
    children: Array.from(el.children)
      .map((c) => extractStructure(c, depth + 1, maxDepth))
      .filter(Boolean),
  }
}

// Style extraction — use with browser_evaluate on target section element (Steps 3-4)
// Run at desktop (1280x900) then mobile (375x812)
function extractStyles(el, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return null
  const s = window.getComputedStyle(el)

  const text =
    el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
      ? el.textContent.trim()
      : null

  return {
    tag: el.tagName.toLowerCase(),
    text,
    styles: {
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontFamily: s.fontFamily,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textAlign: s.textAlign,
      textTransform: s.textTransform,
      color: s.color,
      display: s.display,
      flexDirection: s.flexDirection,
      flexWrap: s.flexWrap,
      alignItems: s.alignItems,
      justifyContent: s.justifyContent,
      gap: s.gap,
      gridTemplateColumns: s.gridTemplateColumns,
      marginTop: s.marginTop,
      marginBottom: s.marginBottom,
      marginLeft: s.marginLeft,
      marginRight: s.marginRight,
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      width: s.width,
      maxWidth: s.maxWidth,
      height: s.height,
      minHeight: s.minHeight,
      backgroundColor: s.backgroundColor,
      borderRadius: s.borderRadius,
      boxShadow: s.boxShadow,
      border: s.border,
      opacity: s.opacity,
      overflow: s.overflow,
      position: s.position,
      backgroundImage: s.backgroundImage,
      background: s.background,
      transform: s.transform,
      transition: s.transition,
      textDecoration: s.textDecoration,
      textDecorationColor: s.textDecorationColor,
      aspectRatio: s.aspectRatio,
      objectFit: s.objectFit,
      objectPosition: s.objectPosition,
    },
    children: Array.from(el.children)
      .map((c) => extractStyles(c, depth + 1, maxDepth))
      .filter(Boolean),
  }
}

// Cookie/modal dismissal — run before extraction if overlays are present
function dismissOverlays() {
  const selectors = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[id*="cookie"]',
    '[class*="banner"]',
  ]
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => el.remove())
  })
}

// Scroll to section — use for lazy-loaded content
function scrollToElement(element) {
  element.scrollIntoView({ behavior: "instant" })
}
```

**Step 2: Commit**

```bash
git add .agents/skills/copy-component/references/extraction-scripts.js
git commit -m "refactor: extract browser scripts from copy-component to reference file"
```

---

### Task 2: Create component mapping reference file

**Files:**

- Create: `.agents/skills/copy-component/references/component-mapping.md`

**Step 1: Extract mapping tables from copy-component SKILL.md**

Read copy-component SKILL.md and extract these sections into a new reference file:

- Typography variant mapping (lines 272-305) — the `<Typography>` variant table and usage rules
- Link/CTA mapping (lines 307-315)
- Image mapping (lines 317-322)
- Section wrapper rule (line 324)
- Shadcn pattern matching table (lines 328-340) and decision flow (lines 342-365)
- Composition analysis patterns (lines 369-377)

Create `.agents/skills/copy-component/references/component-mapping.md` with these tables organized under clear headers. Keep the exact same content — just relocated.

**Step 2: Commit**

```bash
git add .agents/skills/copy-component/references/component-mapping.md
git commit -m "refactor: extract component mapping tables from copy-component to reference file"
```

---

### Task 3: Create Strapi icons reference file

**Files:**

- Create: `.agents/skills/create-content-component/references/strapi-icons.txt`

**Step 1: Extract icon list from create-content-component SKILL.md**

Read create-content-component SKILL.md lines 215. Extract the icon list and write one icon per line to `.agents/skills/create-content-component/references/strapi-icons.txt`.

**Step 2: Commit**

```bash
git add .agents/skills/create-content-component/references/strapi-icons.txt
git commit -m "refactor: extract strapi icon list to reference file"
```

---

### Task 4: Rewrite create-content-component (canonical source)

**Files:**

- Modify: `.agents/skills/create-content-component/SKILL.md`

This skill becomes the single source of truth for dynamic zone rules, naming conventions, and duplicate checks. Other skills reference it.

**Step 1: Rewrite the skill**

Read the current file in full. Rewrite with these changes:

1. **Remove "Caller Contract" section** (lines 126-157) — delete entirely
2. **Remove `skip_react_component` references** — delete the skip condition in Step 5 header and the flag mention
3. **Remove structured result JSON** (Step 9, lines 429-452) — replace with: "Report what was created, updated, reused, and any errors or manual follow-up needed."
4. **Replace icon list** (line 215) with: "Pick an appropriate icon from `references/strapi-icons.txt`"
5. **Compress populate config** (Step 4, lines 254-320): Keep only the decision tree and ONE code example (case 2 — the most common). Drop the `true` case (obvious) and the deep nesting case (rare).
6. **Compress React component** (Step 5): Remove the "no removeThisWhenYouNeedMe" warning. Keep the template and rules.
7. **Keep all dynamic zone tables, naming conventions, and duplicate check logic** intact — these are now the canonical source.

Target: ~250 lines.

**Step 2: Verify coherence**

Read the rewritten file end-to-end. Check:

- All steps still reference each other correctly
- No dangling references to removed sections
- Dynamic zone table is complete and correct
- Naming convention section is complete

**Step 3: Commit**

```bash
git add .agents/skills/create-content-component/SKILL.md
git commit -m "refactor: compress create-content-component, remove PRD artifacts"
```

---

### Task 5: Rewrite copy-component

**Files:**

- Modify: `.agents/skills/copy-component/SKILL.md`

The biggest rewrite — from 731 to ~300 lines.

**Step 1: Rewrite the skill**

Read the current file in full, plus the three new reference files. Rewrite with these changes:

1. **Intake contract**: Keep the YAML block but remove:
   - `acceptance_profile` field and all references
   - CamelCase compatibility section (lines 59-69)
   - Compress validation rules to a checklist

2. **Remove duplicated tables**: Replace with references:
   - Dynamic zone table → "See `create-content-component/SKILL.md` Step 1 for dynamic zone rules"
   - Naming conventions → "See `create-content-component/SKILL.md` Naming Convention"
   - Duplicate checks A-D → "Run duplicate checks per `create-content-component/SKILL.md` Step 1"

3. **Replace inline JS** with reference:
   - Steps 2-4: "Read `references/extraction-scripts.js` and use the `extractStructure` / `extractStyles` functions with `browser_evaluate`"
   - Cookie/scroll helpers: "See `references/extraction-scripts.js` for dismissOverlays/scrollToElement helpers"

4. **Replace inline mapping tables** with reference:
   - Steps 6b-6d: "Read `references/component-mapping.md` for Typography variants, Link/CTA/Image mapping, Shadcn patterns, and Composition analysis"
   - Keep the token mapping reference as-is: "Read `references/token-mapping.md`"

5. **Remove PRD artifacts**:
   - Drop the YAML handoff contract to create-content-component (Step 8, lines 447-485) — replace with: "Invoke `/create-content-component` with the component name, category, and attribute spec from Step 7"
   - Drop structured JSON result (Step 13, lines 617-642) — replace with prose report instruction
   - Drop `seed_payload_ready`, `requires_restart` flags
   - Drop Step 13b registry update (already handled by create-content-component Step 8b)

6. **Compress**:
   - Merge "Section Targeting" into Step 1
   - Step 12b review loop: compress from ~30 to ~10 lines
   - Edge cases section: compress from ~40 to ~15 lines
   - "What This Skill Does NOT Handle" — compress to a bullet list

7. **Keep intact**:
   - The fail-safe rule (line 22)
   - Skill boundaries section (lines 26-30)
   - Step 0 registry freshness check
   - Step 5 verification screenshot
   - Step 6 token mapping (references token-mapping.md)
   - Step 9 React component generation (this is the skill's core value)
   - Step 11 quality gates
   - Step 14 content seeding offer
   - Hover/interactive states extraction

Target: ~300 lines.

**Step 2: Verify coherence**

Read the rewritten file end-to-end. Check:

- All reference file paths are correct
- Steps reference each other correctly
- No dangling references to removed content
- The extraction → mapping → implementation flow is clear and complete

**Step 3: Commit**

```bash
git add .agents/skills/copy-component/SKILL.md
git commit -m "refactor: compress copy-component, extract static data to references"
```

---

### Task 6: Rewrite seed-content

**Files:**

- Modify: `.agents/skills/seed-content/SKILL.md`

**Step 1: Rewrite the skill**

Read the current file in full. Rewrite with these changes:

1. **Remove structured result JSON** (Step 10, lines 239-251) — replace with: "Report actions taken, items created/updated/reused, items skipped/invalid, and any manual follow-up needed."
2. **Remove component matching heuristics table** (lines 293-306) — replace with: "Match source sections to local component UIDs by reading `docs/component-registry.md`. Schema validation decides final mapping."
3. **Merge edge cases into steps**: The "Edge Cases" section (lines 262-291) repeats rules already stated in the steps. Merge:
   - "Unknown schema fields" → into Step 5 mapping plan
   - "Unknown components" → into Step 5 mapping plan
   - "Required data missing" → into Step 5 mapping plan
   - "Missing images" → into Step 7 media resolution
   - "Duplicate content" → into Step 8 relation resolution
   - "Links with page relations" → into Step 5 link rule

Target: ~180 lines.

**Step 2: Verify coherence**

Read end-to-end. Check step references and that no safety rules were lost in the merge.

**Step 3: Commit**

```bash
git add .agents/skills/seed-content/SKILL.md
git commit -m "refactor: compress seed-content, remove stale heuristics"
```

---

### Task 7: Clean shadcn-ui and setup-strapi-mcp

**Files:**

- Modify: `.agents/skills/shadcn-ui/SKILL.md`
- Modify: `.agents/skills/setup-strapi-mcp/SKILL.md`

**Step 1: Clean shadcn-ui**

Read current file. Remove "Parent Skill Contract" section (lines 47-75). This was a formal contract for PRD/ralph invocation. The skill works fine without it — copy-component makes shadcn decisions inline using the pattern tables in `references/component-mapping.md`.

Target: ~65 lines.

**Step 2: Clean setup-strapi-mcp**

Read current file. Remove "Return structured setup report" step (Step 8, lines 148-163, the JSON template). Replace with: "Report what files were created/updated and whether MCP tools are reachable."

Target: ~175 lines.

**Step 3: Commit**

```bash
git add .agents/skills/shadcn-ui/SKILL.md .agents/skills/setup-strapi-mcp/SKILL.md
git commit -m "refactor: clean shadcn-ui and setup-strapi-mcp, remove PRD artifacts"
```

---

### Task 8: Final verification

**Step 1: Line count check**

```bash
wc -l .agents/skills/*/SKILL.md .agents/skills/copy-component/references/*
```

Expected approximate counts:

- copy-component/SKILL.md: ~300
- copy-component/references/extraction-scripts.js: ~70
- copy-component/references/component-mapping.md: ~85
- copy-component/references/token-mapping.md: ~149 (unchanged)
- create-content-component/SKILL.md: ~250
- seed-content/SKILL.md: ~180
- shadcn-ui/SKILL.md: ~65
- setup-strapi-mcp/SKILL.md: ~175
- add-locale/SKILL.md: 77 (unchanged)

**Step 2: Cross-reference check**

Grep for broken references:

- `grep -r "acceptance_profile" .agents/skills/` — should only appear in prd-component (untouched) and copy-component intake contract (removed)
- `grep -r "seed_payload_ready" .agents/skills/` — should only appear in prd-component
- `grep -r "Caller Contract" .agents/skills/` — should be gone from active skills
- `grep -r "structured result" .agents/skills/` — should be gone from active skills

**Step 3: Read each rewritten skill end-to-end**

Quick coherence scan — are all steps numbered correctly? Do references point to files that exist?

**Step 4: Commit any fixes**

```bash
git add -A .agents/skills/
git commit -m "fix: address cross-reference issues from skills cleanup"
```
