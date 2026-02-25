# Component Mapping Reference

Reference tables for mapping extracted HTML elements to existing React components, Strapi schemas, and design patterns.

## Typography Mapping

The project has a `Typography` component at `@/components/typography` with `typo-*` CSS classes. Map extracted sizes to variants:

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

The "Default tag" column shows what Typography uses when no `tag` prop is passed. **Override `tag` when the semantic meaning differs from the visual size** — e.g. a price displayed large: `<Typography tag="p" variant="header3">`, a features section title displayed small: `<Typography tag="h4" variant="body2" fontWeight="medium">`.

For sizes **larger than header1** (53px): use `<Typography tag="h1" variant="header1" className="lg:text-[Xrem]">` with the exact source size as responsive override.

### Typography Props Reference

- `tag`: h1-h6, p, span, label (determines the HTML element — semantic meaning)
- `variant`: controls visual size independently of tag (e.g. `tag="p" variant="header3"` for a price display)
- `textColor`: black, white, primary (default), neutral, muted
- `fontWeight`: bold (default for headers), normal (default for body), semiBold, medium, etc.

### Typography Usage Rules

- Use `<Typography>` for standalone text blocks (headings, paragraphs, labels, descriptions)
- **Decouple semantics from visuals**: when the visual size doesn't match the semantic meaning, use `tag` for correct HTML semantics and `variant` for the visual style (e.g. `<Typography tag="h4" variant="body2" fontWeight="medium">` for a small section title, `<Typography tag="p" variant="header3">` for a large price display)
- Only pass `textColor`/`fontWeight` when they differ from variant defaults
- **Skip Typography** for: inline `<span>` fragments inside a Typography parent, single-word content inside another component's slot (badge, button label), or cases where raw Tailwind on a semantic tag is simpler and clearer
- Spacing/layout classes go on `className`, not as separate wrapper divs
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

   **Correct:**

   ```tsx
   <SectionHeader layout="center" size="default">
     <SectionLabel variant="default">{component.label}</SectionLabel>
     <SectionTitle as="h2" size="default">
       {component.title}
     </SectionTitle>
     <SectionDescription variant="default">
       {component.description}
     </SectionDescription>
   </SectionHeader>
   ```

   **Wrong — loses spacing and max-width control:**

   ```tsx
   <SectionTitle as="h2">{component.title}</SectionTitle>
   <SectionDescription>{component.description}</SectionDescription>
   ```

   Props:
   - `SectionHeader`: `size` (xs/sm/default/lg/xl), `layout` (left/center/right)
   - `SectionTitle`: `as` (h1-h6, default h2), `size` (matches parent), `variant` (default/inverse/purple)
   - `SectionDescription`: `variant` (default/inverse/purple)
   - `SectionLabel`: `variant` (default/inverse/purple), `image` (optional utilities.basic-image icon)

   For dark backgrounds, pass `variant="inverse"` to all children consistently.
   CTAs or content below the header go AFTER `</SectionHeader>` with appropriate margin (`mt-8` typical), not inside it.

2. **Card grid**: 3+ items with identical structure (image + title + text + link) → model as Strapi repeatable component. Render with `.map()` in React using a local sub-component or inline JSX. Use CSS grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).

3. **Icon + text list**: multiple icon-text pairs in a column/row → model as repeatable component with `utilities.basic-image` (icon) + text field. Render with `.map()`.

These rules are deterministic. Only ask the user when the structure is genuinely ambiguous (e.g., mixed card shapes that could be one or two component types).
