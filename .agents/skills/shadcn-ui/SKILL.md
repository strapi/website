---
name: shadcn-ui
description: "Expert guidance for integrating shadcn/ui components in this Next.js monorepo (apps/ui). Handles component discovery, installation via CLI, customization to local conventions (cn() in @/lib/styles, Tailwind v4, radix-ui primitives), and best practices. Use this skill whenever the user wants to add, install, customize, or troubleshoot a shadcn/ui component — even if they just say 'add a button' or 'install tabs'. Also triggers on: shadcn, radix, UI component, cn utility, component library."
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
3. Run the post-install fixup checklist (see below).
4. Integrate component usage where requested.
5. Validate:
   - `pnpm --filter @repo/ui typecheck`
   - `pnpm --filter @repo/ui lint`

## Post-Install Fixup Checklist

After `shadcn add`, review generated files for these common issues:

1. **`cn()` import path**: The CLI should generate `@/lib/styles` (aliased in `components.json`). If it generates `@/lib/utils`, fix the import. This is the most common issue after shadcn upgrades.
2. **Radix imports**: This repo uses the unified `radix-ui` package. If generated code imports from `@radix-ui/react-*` (scoped packages), convert to `radix-ui` imports unless both coexist in `package.json`.
3. **Tailwind v4 CSS variables**: Shadcn v4 components use CSS custom properties (`--radius`, `--primary`, etc.) defined in `apps/ui/src/styles/globals.css`. Verify new components reference variables that exist in globals.css — add missing ones if needed.
4. **`"use client"` directive**: Shadcn components with interactivity include `"use client"`. Keep it — this is a React Server Components project.
5. **Naming conflicts**: Check `apps/ui/src/components/ui/` for existing files before adding. If a component already exists, diff and merge rather than overwrite.

## Common Pitfalls

- **Don't use `tailwind.config.js`**: This project uses Tailwind v4 with CSS-based config (`src/styles/globals.css`). Theme tokens live in `packages/design-system/src/theme.css`. Never create or reference a JS config file.
- **Don't install duplicate primitives**: Before adding a shadcn component that depends on a Radix primitive, check if that primitive is already installed. Run `pnpm --filter @repo/ui list radix-ui` to check.
- **Don't override design system tokens**: Shadcn components may define their own color/spacing variables. Always prefer existing tokens from `packages/design-system/src/theme.css` over shadcn defaults.

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
