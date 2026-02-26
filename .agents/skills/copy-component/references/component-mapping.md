# Component Mapping Reference

Reference tables for mapping extracted HTML elements to existing React components, Strapi schemas, and design patterns.

## SectionHeader Group vs Typography — Decision Tree

**This is the first decision to make for any text element in a section.** Getting this wrong is the most common mistake.

### When to use SectionHeader group (SectionTitle / SectionDescription / SectionLabel)

Use for the **top-level intro block of a page section** — the label+heading+description group that introduces the section's content. This applies when the `<section>` element has any combination of eyebrow label, heading, description, or CTAs as its introductory content.

- **SectionTitle** replaces `<h1>`–`<h6>` and `<Typography variant="header*">` for section headings
- **SectionDescription** replaces `<Typography variant="body1">` and `<p>` for section descriptions
- **SectionLabel** replaces `<Typography variant="smallText1">` and `<p>` for eyebrow labels
- **SectionHeader** wraps all of the above and controls gap spacing, max-width, and alignment

**Scope boundary**: SectionHeader is ONLY for the section's own header group — the introductory text block that sits directly inside `<Container>`, before any grid/list/card content. It is NOT for text inside repeated items, cards, nested components, or other child structures.

### When to use Typography

Use for text blocks that are **NOT the section's top-level intro group**:

- Card titles/descriptions inside repeatable items (`.map()`)
- Prices, stats, or data displays
- Text inside nested/child components (accordion content, tab panels, form labels)
- Inline content labels outside a section header context
- A section that has ONLY body content with no introductory heading group (rare)

### NEVER do this

```tsx
// WRONG — right children but NO <SectionHeader> wrapper, manual gaps instead
// This is the MOST COMMON mistake. The wrapper controls gap, max-width, and alignment.
<SectionLabel variant="purple">{label}</SectionLabel>
<SectionTitle as="h1" size="lg" variant="inverse" className="mt-10">
  {heading}
</SectionTitle>
<SectionDescription variant="inverse" className="mt-4">
  {description}
</SectionDescription>

// WRONG — raw heading inside a section that has label+title+description
<h1 className="mt-10 text-5xl font-bold text-white">{heading}</h1>
<p className="mt-9 text-lg text-white">{description}</p>

// WRONG — Typography for a section heading
<Typography tag="h1" variant="header1" textColor="white">{heading}</Typography>
<Typography tag="p" variant="body1" textColor="white">{description}</Typography>

// RIGHT — SectionHeader wrapper handles gap, max-width, and alignment
<SectionHeader size="lg" layout="left">
  <SectionLabel variant="purple">{label}</SectionLabel>
  <SectionTitle as="h1" size="lg" variant="inverse">{heading}</SectionTitle>
  <SectionDescription variant="inverse">{description}</SectionDescription>
</SectionHeader>
```

## SectionTitle Size Mapping

Map extracted desktop font sizes to SectionTitle `size` presets. **Always use the closest preset — never use raw `<h1>` with manual Tailwind classes when a SectionTitle size fits.**

| Extracted desktop px | SectionTitle size | Actual classes                           |
| -------------------- | ----------------- | ---------------------------------------- |
| ~21px (1.3125rem)    | `xs`              | `text-2xl leading-tight tracking-tight`  |
| ~33px (2.0625rem)    | `sm`              | `text-3xl leading-tight tracking-tight`  |
| ~43px (2.6875rem)    | `default`         | `text-4xl tracking-tight`                |
| ~53px (3.3125rem)    | `lg`              | `text-5xl leading-[1.35] tracking-tight` |
| ~60px (3.75rem)      | `xl`              | `text-6xl leading-[1.4] tracking-tight`  |

All sizes include `font-bold` and `tracking-tight` by default.

### SectionTitle variant colors

| Variant   | Color class        | Use when                 |
| --------- | ------------------ | ------------------------ |
| `default` | `text-foreground`  | Light backgrounds        |
| `inverse` | `text-background`  | Dark backgrounds (white) |
| `purple`  | (inherits default) | Purple-themed sections   |

### SectionDescription defaults

Fixed at `text-strapi-body-1` (17px) with `leading-relaxed`. No size variants.

| Variant   | Color class               | Use when                 |
| --------- | ------------------------- | ------------------------ |
| `default` | `text-strapi-neutral-700` | Light backgrounds        |
| `inverse` | `text-background`         | Dark backgrounds (white) |

**Do not add `text-white` or `textColor="white"` overrides** — `variant="inverse"` already handles dark background colors. Adding manual overrides fights the component system.

### SectionLabel defaults

Fixed at `text-sm uppercase font-bold tracking-wider`.

| Variant   | Color class              | Use when                 |
| --------- | ------------------------ | ------------------------ |
| `default` | `text-strapi-blue-600`   | Light backgrounds        |
| `inverse` | `text-background`        | Dark backgrounds (white) |
| `purple`  | `text-strapi-purple-600` | Purple-themed labels     |

## Typography Mapping

**Use Typography only for text outside SectionHeader groups** (see decision tree above).

| Extracted px        | Typography variant | Default tag | CSS class         |
| ------------------- | ------------------ | ----------- | ----------------- |
| >= 53px (3.3125rem) | `header1`          | `h1`        | `typo-header-1`   |
| >= 43px (2.6875rem) | `header2`          | `h2`        | `typo-header-2`   |
| >= 33px (2.0625rem) | `header3`          | `h3`        | `typo-header-3`   |
| >= 21px (1.3125rem) | `subtitle1`        | `h4`        | `typo-subtitle-1` |
| >= 19px (1.1875rem) | `subtitle2`        | `h5`        | `typo-subtitle-2` |
| >= 17px (1.0625rem) | `body1`            | `p`         | `typo-body-1`     |
| >= 15px (0.9375rem) | `body2`            | `span`      | `typo-body-2`     |
| >= 13px (0.8125rem) | `smallText1`       | `p`         | `typo-small-1`    |
| >= 11px (0.6875rem) | `smallText2`       | `p`         | `typo-small-2`    |

### Typography Props Reference

- `tag`: h1-h6, p, span, label (determines the HTML element — semantic meaning)
- `variant`: controls visual size independently of tag
- `textColor`: black, white, primary (default), neutral, muted
- `fontWeight`: bold (default for headers), normal (default for body), semiBold, medium, etc.

### Typography Usage Rules

- **First check the decision tree above** — if the text is part of a section header group, use SectionTitle/SectionDescription/SectionLabel instead.
- Use `<Typography>` for standalone text blocks outside header groups (card content, prices, stats, inline labels)
- **Decouple semantics from visuals**: `tag` for correct HTML semantics, `variant` for visual style
- Only pass `textColor`/`fontWeight` when they differ from variant defaults
- **Skip Typography** for: inline `<span>` fragments, single-word content inside another component's slot
- Import: `import { Typography } from "@/components/typography"`

## Link/CTA Mapping

| Source Pattern                                   | Strapi Schema                                   | React Component     |
| ------------------------------------------------ | ----------------------------------------------- | ------------------- |
| `<a>` styled as button (filled bg, border, etc.) | `utilities.link` + `utilities.link-decorations` | `<StrapiLink>`      |
| `<a>` plain text (underline on hover)            | `utilities.link-text`                           | `<StrapiLinkText>`  |
| `<a>` wrapping an image                          | `utilities.link-image`                          | `<StrapiLinkImage>` |

Button variant detection from source styles: filled background → `"default"`, outline/border only → `"outline"`, text-only/underline → `"link"`, transparent bg with hover → `"ghost"`.

## Image Mapping

| Source Pattern          | Strapi Schema           | React Component      |
| ----------------------- | ----------------------- | -------------------- |
| `<img>` in content area | `utilities.basic-image` | `<StrapiBasicImage>` |
| `<img>` inside `<a>`    | `utilities.link-image`  | `<StrapiLinkImage>`  |

## Section Wrapper Rule

Every page-level section component uses `<section>` → `<Container>` structure. Import Container from `@/components/elementary/Container`. Background color (`bg-*`) and vertical padding (`py-*`) go on `<section>` — NOT on `<Container>` — so the background spans the full viewport width. `<Container>` is never omitted and never receives `bg-*` classes.

## Shadcn Pattern Matching

Check `docs/component-registry.md` → "Shadcn/UI Installed" for available components. Match source UI patterns to shadcn components:

| Source Pattern                         | Shadcn Component |
| -------------------------------------- | ---------------- |
| Collapsible panels with toggle headers | `Accordion`      |
| Tab bar with switchable panels         | `Tabs`           |
| Bordered box with header/body/footer   | `Card`           |
| Horizontal scroll with arrows/dots     | `Carousel`       |
| Data rows+columns with headers         | `Table`          |
| Modal overlay on button click          | `Dialog`         |
| Floating info on hover                 | `Tooltip`        |
| Pill-shaped status indicators          | `Badge`          |
| Binary toggle                          | `Switch`         |

### Shadcn Mode Decision Flow

Policy-driven decision flow (`shadcn_mode` from intake):

1. If `shadcn_mode=no-shadcn`:
   - Do not install or introduce new shadcn components.
   - Reuse existing local primitives/wrappers.
2. If `shadcn_mode=prefer-existing`:
   - Reuse installed shadcn components when available.
   - If unavailable, prefer existing local non-shadcn primitives.
   - Do not request installs by default.
3. If `shadcn_mode=allow-install`:
   - Reuse installed shadcn first.
   - If unavailable and no equivalent local primitive exists, ask user to approve install:
     - `cd apps/ui && pnpm dlx shadcn@latest add {name}`
   - After install, update `docs/component-registry.md` "Shadcn/UI Installed" list.

Always emit a deterministic decision summary for each matched pattern:

```yaml
shadcn_decision:
  source_pattern: <pattern>
  chosen_component: <shadcn_or_local_component>
  install_needed: <true|false>
  reason: <one-line rationale>
```

## Composition Patterns

Detect common composition patterns in the extracted structure:

1. **Section header**: heading + subtitle/description group at section top → ALWAYS wrap in `<SectionHeader>` from `@/components/elementary/section-header`. This controls gap spacing, max-width, and alignment. Never render SectionTitle/SectionDescription without the wrapper.

   **Correct — with CTAs inside:**

   ```tsx
   <SectionHeader layout="center" size="default">
     <SectionLabel variant="default">{component.label}</SectionLabel>
     <SectionTitle as="h2" size="default">
       {component.heading}
     </SectionTitle>
     <SectionDescription variant="default">
       {component.description}
     </SectionDescription>
     {component.ctas && component.ctas.length > 0 && (
       <div className="mt-8 flex flex-wrap gap-4">
         {component.ctas.map((cta) => (
           <StrapiLink key={cta.id} component={cta} />
         ))}
       </div>
     )}
   </SectionHeader>
   ```

   **Wrong — right children but missing `<SectionHeader>` wrapper (most common mistake):**

   ```tsx
   <SectionLabel variant="purple">{component.label}</SectionLabel>
   <SectionTitle as="h2" size="lg" variant="inverse" className="mt-10">
     {component.heading}
   </SectionTitle>
   <SectionDescription variant="inverse" className="mt-4">
     {component.description}
   </SectionDescription>
   ```

   The wrapper provides gap spacing, max-width constraint, and text alignment — manual `mt-*` classes between children are a sign the wrapper is missing.

   **Wrong — raw elements with manual spacing:**

   ```tsx
   <h1 className="mt-10 text-5xl font-bold text-white">{component.heading}</h1>
   <p className="mt-9 text-lg text-white">{component.description}</p>
   ```

   **Wrong — unnecessary variant overrides:**

   ```tsx
   <SectionDescription variant="inverse" className="text-white">
     {component.description}
   </SectionDescription>
   ```

   ### SectionHeader gap control

   SectionHeader controls spacing between its children via the `size` preset's `gap-*` class. **Do NOT add manual margin classes (`mt-*`) between SectionLabel, SectionTitle, and SectionDescription** — the gap handles it. Only use explicit `mt-*` on non-standard children like CTA containers or content grids that need extra separation.

   | SectionHeader size | Gap              |
   | ------------------ | ---------------- |
   | `xs`               | `gap-3` (12px)   |
   | `sm`               | `gap-3.5` (14px) |
   | `default`          | `gap-4` (16px)   |
   | `lg`               | `gap-4` (16px)   |
   | `xl`               | `gap-5` (20px)   |

   ### Props reference
   - `SectionHeader`: `size` (xs/sm/default/lg/xl), `layout` (left/center/right)
   - `SectionTitle`: `as` (h1-h6, default h2), `size` (matches SectionHeader size), `variant` (default/inverse/purple)
   - `SectionDescription`: `variant` (default/inverse/purple)
   - `SectionLabel`: `variant` (default/inverse/purple), `image` (optional utilities.basic-image icon)

   ### Dark background rule

   For dark backgrounds, pass `variant="inverse"` to ALL children consistently. This is sufficient — do not add manual `text-white`, `textColor="white"`, or color overrides. The `inverse` variant already maps to white/light colors.

2. **Card grid**: 3+ items with identical structure (image + title + text + link) → model as Strapi repeatable component. Render with `.map()` in React using a local sub-component or inline JSX. Use CSS grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).

3. **Icon + text list**: multiple icon-text pairs in a column/row → model as repeatable component with `utilities.basic-image` (icon) + text field. Render with `.map()`.

These rules are deterministic. Only ask the user when the structure is genuinely ambiguous (e.g., mixed card shapes that could be one or two component types).
