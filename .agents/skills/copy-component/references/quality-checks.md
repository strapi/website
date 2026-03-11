# Quality Checks

Shared checklist used by both Step 8 (quality gates) and Step 10 (visual validation iteration loop).

## Code Quality Checklist

1. **SectionHeader wrapping**: `SectionLabel`, `SectionTitle`, `SectionDescription` are wrapped in a `<SectionHeader>` parent — if you see these children without the wrapper, or with manual `mt-*`/`gap-*`/`space-y-*` classes between them, the wrapper is missing.
2. **SectionTitle size**: Uses a `size` preset (xs/sm/default/lg/xl), not raw Tailwind font classes.
3. **Dark background sections**: Use `variant="inverse"` on ALL SectionHeader children consistently. No manual `text-white` overrides.
4. **Typography usage**: Standalone text blocks (outside SectionHeader) use `<Typography>` with `tag` for semantics and `variant` for visuals.
5. **Links/images**: Use Strapi utility wrappers — `<StrapiLink>`/`<StrapiLinkText>` for links, `<StrapiBasicImage>`/`<StrapiLinkImage>` for images.
6. **Section structure**: `<section>` → `<Container>` two-layer structure present.
7. **No duplicate UID or `ContentComponents` mapping**.
8. **Populate config exists** at `apps/strapi/src/populateDynamicZone/{category}/{name}.ts` for dynamic-zone-level components.
9. **No unused imports**.
10. **Optional fields guarded** with conditionals.
11. **Component library**: `apps/ui/src/app/[locale]/dev/component-library/page.tsx` has a `<Section>` for this component with mock data and variants — if missing, add it following the pattern from `create-content-component` Step 9.
