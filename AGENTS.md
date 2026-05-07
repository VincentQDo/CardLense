# Coding Standards For AI Agents

## Required Checks

- Run `npm run validate` before handing work back. This includes formatting, linting, type checks, project standards, production build, and smoke tests.
- Run `npm run setup:hooks` once after cloning so local Git hooks run the project gates.
- Use `npm run lint:fix` and `npm run format` for mechanical fixes.
- Do not create additional coding-standard scripts. Use `standards-check.mjs` for project-specific style gates.
- Keep `standards-check.mjs` lightweight and focused on rules not enforced by ESLint or Prettier.

## Svelte And TypeScript

- Use `<script lang="ts">` in every Svelte component.
- Keep TypeScript strict. Do not add `any`; model data with explicit types.
- Keep functions small. Split logic before it trips the complexity, nesting, or function-length lint rules.
- Do not use `for` or `for...in` in app code. Prefer `for...of`, array helpers, object helpers, or Svelte `{#each}` blocks.
- Do not use nested ternaries. Prefer named variables or small helper functions.
- Key every Svelte `{#each}` block.

## Styling

- Prefer daisyUI component classes first: `btn`, `card`, `navbar`, `menu`, `badge`, `stats`, `toggle`, `hero`, and related variants.
- Use Tailwind utilities for layout, spacing, responsive behavior, and small visual adjustments.
- Do not add component `<style>` blocks or inline `style=` attributes.
- Keep `src/app.css` limited to Tailwind and daisyUI setup unless a project-level styling decision explicitly changes it.
- Avoid custom CSS when a daisyUI class or Tailwind utility can express the same result. The current policy is a hard ban unless this standard is changed first.

## Markup

- Use real links for navigation, not nested `button > a` markup.
- Add `type="button"` to non-submit buttons.
- Keep copy and class lists readable; prefer extracting typed arrays or small components over repeating large markup blocks.

## Architecture

- Follow existing file patterns before creating new abstractions.
- Keep business logic out of Svelte components.
- Put reusable types in `src/lib/types`.
- Put pure helpers in `src/lib/utils`.
- Prefer server load functions over client-side fetches when data is needed for a route.
- Avoid writable stores unless state must be shared across routes/components.

## Imports

- Use `$lib` aliases instead of long relative imports.
- Prefer type-only imports for types.
- Do not deep import from unrelated feature folders.
