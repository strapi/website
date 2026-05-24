/**
 * Shared item styling for the column-grid sections (two- and three-column).
 * Kept in one module so the two grids can't drift on size/variant scales.
 */

export type ColumnGridSize = "default" | "lg" | "xl"
export type ColumnGridVariant = "default" | "purple"

export function getColumnGridItemClasses(
  size: ColumnGridSize,
  variant: ColumnGridVariant
): { title: string; description: string } {
  const titleSize =
    size === "xl"
      ? "text-4xl tracking-tight font-bold"
      : size === "lg"
        ? "text-3xl tracking-tight font-semibold"
        : "text-2xl font-semibold"

  const titleColor =
    variant === "purple" ? "text-strapi-purple-600" : "text-foreground"

  const descriptionSize = size === "xl" ? "text-xl leading-relaxed" : "text-lg"

  return {
    title: `${titleSize} ${titleColor}`,
    description: `${descriptionSize} text-strapi-neutral-700`,
  }
}
