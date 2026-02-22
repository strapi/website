# strapi-website

Source code for the [strapi.io](https://strapi.io/) website. Monorepo with Strapi v5 CMS backend and Next.js 16 frontend.

## Tech stack

- [Strapi v5](https://strapi.io/) — Headless CMS
- [Next.js v16](https://nextjs.org/docs) — App Router, React 19
- [Shadcn/ui](https://ui.shadcn.com/) + [TailwindCSS v4](https://tailwindcss.com/) — UI components and styling
- [Turborepo](https://turbo.build/) — Monorepo tooling

## Getting started

### Prerequisites

- Docker — required for the PostgreSQL database
- Node.js 22 — we recommend using [nvm](https://github.com/nvm-sh/nvm) to manage versions
- pnpm 10

### Setup

1. Clone the repository

   ```sh
   git clone <repo-url>
   cd strapi-website
   ```

2. Install dependencies

   ```sh
   # Switch to the correct Node.js version (v22)
   nvm use

   # Optionally, ensure the right pnpm version
   corepack prepare pnpm@10.28.1 --activate

   # Install all workspace dependencies
   pnpm install
   ```

3. Configure the API token

   Before the frontend can fetch content from Strapi, you need to create an API token.

   ```sh
   # Start Strapi first
   pnpm dev:strapi
   ```

   > [!WARNING]
   > This step is required before the first run. Without the token, the UI app won't be able to load any content.

   Open the Strapi admin at [http://localhost:1337/admin](http://localhost:1337/admin), navigate to [Settings > API Tokens](http://localhost:1337/admin/settings/api-tokens), and create a new token. Copy its value into `STRAPI_REST_READONLY_API_KEY` in `apps/ui/.env.local`.

   Refer to the [UI README](apps/ui/README.md#environment-variables) for details on all environment variables.

4. Run the project

   ```sh
   # Start both Strapi and Next.js in dev mode
   pnpm dev
   ```

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Strapi admin: [http://localhost:1337/admin](http://localhost:1337/admin)

## Project structure

### Apps

| Path          | Description                                         |
| ------------- | --------------------------------------------------- |
| `apps/ui`     | Next.js 16 frontend ([README](./apps/ui/README.md)) |
| `apps/strapi` | Strapi v5 CMS ([README](./apps/strapi/README.md))   |

### Packages

| Path                         | Description                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `packages/eslint-config`     | Shared ESLint + Prettier config                                                        |
| `packages/typescript-config` | Shared tsconfig                                                                        |
| `packages/design-system`     | Shared design tokens and styles                                                        |
| `packages/shared-data`       | Shared constants and types                                                             |
| `packages/strapi-types`      | Auto-generated types from Strapi schemas ([README](./packages/strapi-types/README.md)) |

## Scripts

```bash
pnpm dev              # Run all apps
pnpm dev:ui           # Run Next.js only
pnpm dev:strapi       # Run Strapi only
pnpm build            # Build all
pnpm lint             # Lint all packages
pnpm commit           # Interactive conventional commit
```

Cleanup utilities:

```bash
bash ./scripts/utils/rm-modules.sh    # Remove all node_modules
bash ./scripts/utils/rm-all.sh        # Remove node_modules, .next, .turbo, .strapi, dist
bash ./scripts/utils/rm-next-cache.sh  # Remove .next caches
```

## Contributing

### Commits

Uses [conventional commits](https://www.conventionalcommits.org/) enforced by Husky + commitlint.

```
feat(ui): add dark mode toggle
fix(strapi): resolve null pointer on login
chore: update dependencies
```

When introducing new env variables, mention them in the commit body (`env.VARIABLE_NAME`). The [auto-pr workflow](.github/workflows/auto-pr.yml) extracts these into the PR description.

### CI

- **ci.yml** — builds on every push/PR to `main`
- **qa.yml** — manual trigger for E2E, accessibility, and performance tests
- **auto-pr.yml** — auto-creates PRs from `dev` to `main`

## Documentation

Detailed docs are in the [/docs](./docs) directory and in individual app/package READMEs.

## Credits

Built on top of [strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter) by [Notum](https://github.com/notum-cz).
