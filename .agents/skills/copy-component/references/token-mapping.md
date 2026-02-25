# Token Mapping Reference

Detailed lookup tables for mapping extracted computed CSS values to Tailwind classes using the project's design system tokens.

**Canonical source**: `packages/design-system/src/theme.css` — always read the theme file at workflow start. These tables are fallback guidance when the theme file values match.

## Table of Contents

- [Visual Tolerance Rule](#visual-tolerance-rule)
- [Typography](#typography-font-size--text--class)
- [Font Weight](#font-weight--font--class)
- [Colors](#colors-rgb--design-token)
- [Spacing](#spacing-px--spacing-scale)
- [Border Radius](#border-radius--rounded--class)
- [Layout](#layout--flexgrid-classes)
- [Responsive Diffing](#responsive-diffing)

## Visual Tolerance Rule

The source site (strapi.io) has inconsistent styling — buttons with 3px vs 4px radius, text at 14px vs 15px, spacing at 13px vs 12px. These are source inconsistencies, not intentional design choices. **Always snap to the nearest design token:**

- **Border radius**: snap to `4px` (strapi-sm), `6px` (strapi-md), `10px` (strapi-lg), or `9999px` (full). A source 3px, 5px, or 8px radius is not a new value — it's the nearest strapi token.
- **Font size**: snap to the typography scale (`11/13/15/17/19/21/33/43/53px`). A source 14px is `text-base` (15px), a 16px is `text-lg` (17px).
- **Spacing**: snap to the 4px grid (`4/8/12/16/20/24/32/40/48/64/80/96px`). A source 13px is `3` (12px), a 22px is `5` (20px) or `6` (24px).
- **Colors**: snap to Strapi design tokens. A source `#4a46ff` is `strapi-blue-600` (`#4945ff`), not an arbitrary `[#4a46ff]`.
- **Font weight**: snap to standard weights (`400/500/600/700`). Never use arbitrary `[450]` or `[550]`.

**Never use arbitrary Tailwind values** (`text-[14px]`, `rounded-[3px]`, `gap-[13px]`) when a design token is within ±2px. Arbitrary values are only acceptable when no token is reasonably close (e.g. a decorative element at 200px radius).

**Existing UI components always win**: If the source has a button that's 1px different from the shadcn `Button`, use `Button`. If a card has slightly different padding than shadcn `Card`, use `Card` with className overrides. Never create a custom component to match a minor source variation.

## Typography (font size → text-\* class)

The design system remaps the standard Tailwind text scale to match Strapi's type sizes (15px base instead of 16px). Always prefer standard Tailwind classes — the `text-strapi-*` aliases exist in the theme but are redundant.

| Computed px      | Token         | Tailwind class |
| ---------------- | ------------- | -------------- |
| 11px (0.6875rem) | `--text-xs`   | `text-xs`      |
| 13px (0.8125rem) | `--text-sm`   | `text-sm`      |
| 15px (0.9375rem) | `--text-base` | `text-base`    |
| 17px (1.0625rem) | `--text-lg`   | `text-lg`      |
| 19px (1.1875rem) | `--text-xl`   | `text-xl`      |
| 21px (1.3125rem) | `--text-2xl`  | `text-2xl`     |
| 33px (2.0625rem) | `--text-3xl`  | `text-3xl`     |
| 43px (2.6875rem) | `--text-4xl`  | `text-4xl`     |
| 53px (3.3125rem) | `--text-5xl`  | `text-5xl`     |

For non-exact matches, snap to the nearest standard Tailwind token (see Visual Tolerance Rule). Never use arbitrary `text-[Xpx]` when a token is within ±2px. Values above 53px use `text-6xl` (60px), `text-7xl` (72px), etc.

## Font weight → font-\* class

| Computed | Tailwind class    |
| -------- | ----------------- |
| 100      | `font-thin`       |
| 200      | `font-extralight` |
| 300      | `font-light`      |
| 400      | `font-normal`     |
| 500      | `font-medium`     |
| 600      | `font-semibold`   |
| 700      | `font-bold`       |
| 800      | `font-extrabold`  |
| 900      | `font-black`      |

## Colors (RGB → design token)

Convert extracted `rgb(r, g, b)` to hex. Match against Strapi color tokens in `theme.css` using closest Euclidean RGB distance. Priority order:

1. Strapi tokens (`strapi-blue-600`, `strapi-neutral-800`, etc.)
2. Shadcn semantic tokens (`primary`, `foreground`, `muted`, etc.)
3. Default Tailwind palette (`slate-500`, `blue-600`, etc.)

Common Strapi mappings:

| Hex       | Token                         |
| --------- | ----------------------------- |
| `#ffffff` | `strapi-neutral-0` or `white` |
| `#f6f6f9` | `strapi-neutral-100`          |
| `#32324d` | `strapi-neutral-800`          |
| `#212134` | `strapi-neutral-900`          |
| `#4945ff` | `strapi-blue-600` (primary)   |
| `#635cff` | `strapi-blue-500`             |

For `backgroundColor`, use `bg-{token}`. For `color`, use `text-{token}`.

If no candidate token is within ~5 RGB distance, use an arbitrary value class (for example `text-[#hex]`, `bg-[#hex]`) and report it as a follow-up tokenization candidate. Near-matches (1-2 hex digits off) are source inconsistencies — snap to the token.

## Spacing (px → spacing scale)

Tailwind spacing: `value / 4 = multiplier` (base `--spacing: 0.25rem`).

| Computed | Tailwind class |
| -------- | -------------- |
| 0px      | `0`            |
| 4px      | `1`            |
| 8px      | `2`            |
| 12px     | `3`            |
| 16px     | `4`            |
| 20px     | `5`            |
| 24px     | `6`            |
| 32px     | `8`            |
| 40px     | `10`           |
| 48px     | `12`           |
| 64px     | `16`           |
| 80px     | `20`           |
| 96px     | `24`           |

For non-exact matches, snap to the nearest 4px-grid value (see Visual Tolerance Rule). Never use arbitrary `p-[13px]` when `p-3` (12px) is close enough. Apply as `p-{n}`, `m-{n}`, `gap-{n}`, `px-{n}`, `py-{n}`, etc.

## Border radius → rounded-\* class

| Computed | Token                | Tailwind class      |
| -------- | -------------------- | ------------------- |
| 4px      | `--radius-strapi-sm` | `rounded-strapi-sm` |
| 6px      | `--radius-strapi-md` | `rounded-strapi-md` |
| 10px     | `--radius-strapi-lg` | `rounded-strapi-lg` |
| 9999px   | —                    | `rounded-full`      |

For non-exact matches, snap to the nearest Strapi token (see Visual Tolerance Rule above). Standard Tailwind fallbacks: `rounded-sm` (2px), `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px).

## Layout → flex/grid classes

| Computed                         | Tailwind class    |
| -------------------------------- | ----------------- |
| `display: flex`                  | `flex`            |
| `display: grid`                  | `grid`            |
| `flex-direction: column`         | `flex-col`        |
| `flex-direction: row`            | `flex-row`        |
| `align-items: center`            | `items-center`    |
| `justify-content: center`        | `justify-center`  |
| `justify-content: space-between` | `justify-between` |
| `flex-wrap: wrap`                | `flex-wrap`       |
| `text-align: center`             | `text-center`     |
| `text-align: left`               | `text-left`       |
| `overflow: hidden`               | `overflow-hidden` |

## Responsive Diffing

Compare desktop (Step 3) vs mobile (Step 4) styles for each element:

- If layout changes (e.g. `flex-direction` row→column), use responsive prefix: `flex-col lg:flex-row`
- If font-size changes, use responsive prefix: `text-lg lg:text-3xl`
- If spacing changes significantly, use responsive prefix: `py-8 lg:py-16`
- Mobile styles are the base (no prefix), desktop overrides use `lg:` prefix

**Layout diff validation**: If desktop and mobile layouts are structurally very different (not just direction/size changes), ask the user directly:

- "Simplify to closest common layout"
- "Implement both with responsive classes"
- "Desktop-only layout"
