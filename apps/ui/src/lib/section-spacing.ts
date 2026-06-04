/**
 * Single source of truth for the vertical rhythm between page-builder sections.
 *
 * The dynamic-zone renderer applies this as the gap below every section, so
 * section components must NOT add their own vertical padding — it would stack
 * on top of this and break the uniform rhythm.
 *
 * Exceptions that keep their own vertical spacing: the hero (needs a fixed
 * navbar offset) and any section rendered outside the dynamic zone (e.g.
 * comparator-grid in the comparison view).
 */
export const SECTION_SPACING = "mb-8 md:mb-12 lg:mb-16"
