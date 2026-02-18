---
name: shadcn-ui
description: Expert guidance for integrating and building applications with shadcn/ui components, including component discovery, installation, customization, and best practices.
---

# shadcn/ui Essentials (Repo-Specific)

Use this skill to add or adapt shadcn/ui components in this monorepo without fighting local conventions.

## Scope

- Focus on `apps/ui`.
- Keep instructions lean and stable.
- Use official shadcn docs for evolving details instead of copying full docs into this skill

## Source of Truth

Read these files first in the target repo:

- `apps/ui/components.json`
- `apps/ui/package.json`
- `apps/ui/src/lib/styles.ts`
- `apps/ui/src/styles/globals.css`

Current repo conventions to preserve:

- `cn()` lives in `@/lib/styles` (not `@/lib/utils`).
- UI components are in `apps/ui/src/components/ui`.
- Aliases are defined in `apps/ui/components.json`.
- Existing primitives commonly import from the `radix-ui` package in this repo.
- Tailwind is configured for v4-style CSS entry (`components.json.tailwind.css`).

## Workflow

1. Confirm target component(s) and whether this is add vs. refactor.
2. Run shadcn CLI from `apps/ui`:
   - `pnpm dlx shadcn@latest add <component>`
3. Review generated files and normalize to repo conventions:
   - Use `@/lib/styles` for `cn`.
   - Respect existing import and naming style.
   - Keep/align primitive imports with current repo strategy (`radix-ui`) unless explicitly migrating.
4. Integrate component usage where requested.
5. Validate:
   - `pnpm --filter @repo/ui typecheck`
   - `pnpm --filter @repo/ui lint`

## Parent Skill Contract

When invoked by another skill (for example `copy-component`), use this deterministic contract.

Input fields:

- `shadcn_mode`: `prefer-existing|allow-install|no-shadcn`
- `source_pattern`: interaction pattern to map (accordion/tabs/dialog/etc.)
- `candidate_component`: target shadcn component name
- `local_alternative`: existing non-shadcn primitive/wrapper if any

Decision rules:

1. `no-shadcn`: do not install or introduce new shadcn components.
2. `prefer-existing`: reuse installed shadcn first; otherwise use local alternative.
3. `allow-install`: reuse installed shadcn first; install only when no suitable local alternative exists and user approves.

Return block:

```json
{
  "chosen_component": "",
  "install_needed": false,
  "reused_shadcn_components": [],
  "new_installs_requested": [],
  "restyle_actions": [],
  "reason": ""
}
```

## Guardrails

- Do not paste frozen dependency matrices into this skill.
- Do not assume old Tailwind v3 config patterns (`tailwind.config.js`, `@tailwind base` blocks).
- Do not force conversion between `radix-ui`, `@radix-ui/*`, or Base UI unless user requests migration.
- Follow existing codebase patterns over generic shadcn examples.

## Official References

- Docs home: https://ui.shadcn.com/docs
- Shadcn LLM Docs: https://ui.shadcn.com/llms.txt
- Next.js install: https://ui.shadcn.com/docs/installation/next
- Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4
- CLI: https://ui.shadcn.com/docs/cli
- Components: https://ui.shadcn.com/docs/components
