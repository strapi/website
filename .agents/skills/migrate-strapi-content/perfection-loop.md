# Perfection Loop — migrate-strapi-content

A meta-process that **iteratively improves the `migrate-strapi-content` skill** by migrating real pages, comparing the rendered result against the live v4 source, and editing the skill's own files to close every _skill-side_ gap. It runs one page per tick under fresh context; the queue and state live in `iteration-log.md` (sibling of this file).

This doc is the contract the `/loop` runner follows. The migration mechanics themselves live in `SKILL.md` — this doc never re-specifies them, it orchestrates runs of them.

## Loop vs. skill — who does what

- **The skill (`SKILL.md`)** performs one autonomous migration: parse URL → map slices → write draft → publish. It never asks the user and never edits itself.
- **The loop (this doc)** runs the skill on one page, judges the result against the source, and — when the gap is the skill's fault — **edits the skill's own files** (`SKILL.md`, `components-cheatsheet.csv`, `visual-cache.json`) so the next page benefits. The loop is also fully autonomous: accumulate findings, edit the skill, report at the end. Do **not** ask the user mid-loop.

### In scope for loop edits

`SKILL.md`, `components-cheatsheet.csv`, `visual-cache.json` — the skill's own behavior.

### Out of scope → **park** the page (never edit these)

- Frontend render bugs in `apps/ui/` (data is correct in Strapi but the Next.js component doesn't render it).
- Missing v5 component (needs `/create-content-component`).
- Strapi content-type schema changes in `apps/strapi/`.
- Missing/unlocatable source or target record (nothing to migrate).

Parking records the blocker and reason; it does not attempt a fix outside the skill.

## Page state machine

Each page in `iteration-log.md` is in exactly one state:

| State         | Meaning                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `queue`       | Not started.                                                                                                             |
| `in-progress` | Has had ≥1 pass; the last pass found a fixable skill-side gap, a skill edit was applied, needs another pass to verify.   |
| `perfected`   | Migrated + published; rendered target matches source within skill scope; **no outstanding skill-side gap**. Terminal.    |
| `parked`      | Blocked on something out of scope (see above) **or** hit the pass cap. Records blocker + reason. Terminal for this loop. |

## Per-tick algorithm

One tick = one page pass. Fresh context each tick (so the latest `SKILL.md` is always re-read).

1. **Read `iteration-log.md`.** Pick the work item:
   - Resume the single `in-progress` page if one exists; else
   - Take the first `queue` page (top to bottom).
   - If none of either → **stop** (see Stop conditions).
2. **Mark it `in-progress`** and allocate the next workspace dir `…-workspace/iteration-<N>/` (N = next integer after the highest existing). Record `iteration-<N> → <slug>, pass <p>` in the log.
3. **Invoke the skill** via the `Skill` tool (`migrate-strapi-content`) on this one URL. This re-reads `SKILL.md` fresh, so any edit from a prior tick is in effect.
4. **Run the per-page perfection protocol** (below).
5. **Decide the outcome** for this pass: `perfected` | `needs-another-pass` | `parked`.
   - `needs-another-pass`: a skill-side gap was found AND is fixable in `SKILL.md`/CSV/`visual-cache.json`. Apply the edit now, keep state `in-progress`, increment pass count. Next tick re-runs the same page.
   - `parked`: the only remaining gap is out of scope, or the pass cap is hit.
   - `perfected`: no skill-side gap remains.
6. **Update `iteration-log.md`**: new state, pass count, link to the tick's `findings.md`, and a one-line list of any skill edits applied this pass.
7. **End the tick.** The `/loop` runner schedules the next one.

## Per-page perfection protocol (steps inside one pass)

Reconstructed from iteration-1/2/3. Each pass produces a `findings.md` in its workspace dir.

1. **Dry-run / inspect source.** Deep-populate the source record (per `SKILL.md` Step 8) and save the raw + deep JSON to `iteration-<N>/dry-run/`. Confirm the slice shapes and that nested component sub-fields resolve (the shallow-populate gotcha).
2. **Migrate.** Run the skill end-to-end: map → PUT draft → publish. Save the built payload to `iteration-<N>/dry-run/put-payload.json`.
3. **Visual diff, section by section.** Screenshot the v4 source (`strapi.io/...`) and the v5 target (`website-ui-omega.vercel.app/...`) and compare per section. Save to `iteration-<N>/screenshots/`. Use the live component library (`/dev/component-library`) when a candidate component's correct variant is unclear.
4. **Write `findings.md`.** For each section: source vs. target verdict. Classify every gap as **skill-side** (wrong UID, wrong field alias, wrong variant, bad populate spec, stale `visual-cache.json` entry) or **frontend-side / out-of-scope**.
5. **Close skill-side gaps.** Edit `SKILL.md` / `components-cheatsheet.csv` / `visual-cache.json` to fix each skill-side gap. (CSV is source of truth; keep Step 6 in `SKILL.md` in sync — see the skill's "Mapping references" note.) Record edits in the log.
6. **Judge:** if any skill-side gap was fixed this pass → `needs-another-pass` (re-verify next tick). If the only gaps left are out-of-scope → `parked` with the blocker. If clean → `perfected`.

## Guardrails

- **Visual validation is the PRIMARY signal (most important).** Each pass MUST use Playwright to render and screenshot both the v4 source and the v5 target, section by section. And the orchestrator MUST independently **view** (Read) the target full-page screenshot itself each tick — plus the source for any section the pass flags as a gap — rather than accepting the pass's prose verdict alone. Data checks (JSON/schema) catch dropped fields; only looking at the rendered page catches layout/variant/visual-fidelity regressions. If the target screenshot can't be produced, that's a blocker to resolve, not a step to skip.
- **Pass cap: 4 passes per page.** On the 5th would-be pass, force `parked` with reason `pass-cap-reached` plus the unresolved gap. Prevents an infinite polish loop. (Iteration-1 needed a large rewrite; later pages should converge in 1–2 passes.)
- **Never overwrite curated top-level fields** — that rule lives in the skill; the loop doesn't relax it.
- **Don't re-screenshot from cache blindly** — if a prior pass cached a visual decision that the current source contradicts, invalidate that `visual-cache.json` entry (it's a skill-side gap).
- **Autonomous** — no `AskUserQuestion` during the loop. Surface everything in the per-page `findings.md` and the final summary.

## Stop conditions

Stop the loop and post a final summary when **either**:

- The queue is empty (no `queue` and no `in-progress` pages remain), or
- Every remaining page is `parked`.

## Final summary (on stop)

One compact table: per page → final state, pass count, workspace dir, one-line outcome. Plus an aggregated list of **skill edits applied across the whole loop** (the durable value) and a list of **parked blockers** grouped by type (frontend / missing-component / schema / missing-record) so the user knows exactly what's left and who owns it.
