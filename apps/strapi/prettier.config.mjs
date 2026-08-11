import { prettierOptions } from "@repo/eslint-config/configs"

/**
 * Prettier configuration for Strapi must exclude the Tailwind plugin,
 * otherwise generating types fails.
 */
export default {
  ...prettierOptions,
  plugins: prettierOptions.plugins.filter(
    (p) => !String(p).includes("prettier-plugin-tailwindcss")
  ),
}
