# Copilot Instructions for Recipe Ranker

## Purpose
Recipe Ranker is a web-first recipe ranking app built with Next.js App Router, React, and TypeScript.

Read the product context and roadmap first:
- README: ../README.md

## Fast Start Commands
Use npm commands from the repository root.

- Install: npm install
- Dev server: npm run dev
- Build: npm run build
- Lint: npm run lint
- Production start: npm run start

Notes:
- There is currently no test script in package.json.
- Treat lint as the main automated quality gate.

## Architecture at a Glance
Keep changes within the existing boundaries.

- App routes and page composition live under src/app
- Shared UI components live under src/components
- Recipe domain types and in-memory data source live in src/lib/recipes.ts

Key route files:
- src/app/layout.tsx
- src/app/page.tsx
- src/app/recipes/[slug]/page.tsx
- src/app/submit/page.tsx

Key shared modules:
- src/components/recipe-card.tsx
- src/components/ranking-list.tsx
- src/lib/recipes.ts

## Conventions to Follow
- Use strict TypeScript patterns already enabled in tsconfig.json.
- Prefer path aliases with @/* for internal imports.
- Preserve the App Router approach and existing route structure.
- Keep UI styling aligned with global CSS variables in src/app/globals.css.
- Keep utility-class style consistent with existing Tailwind usage.

## Data and Behavior Guardrails
- Current recipe data is local and in-memory (src/lib/recipes.ts). Do not imply persistence unless you are implementing it.
- Recipe detail pages rely on generateStaticParams from local recipe slugs in src/app/recipes/[slug]/page.tsx.
- The submit page is a UI stub. The primary button is not a real submit flow yet.
- Ranking components assume numeric personalRating and personalRank values.
- Preserve the current dynamic route params pattern in src/app/recipes/[slug]/page.tsx unless you intentionally refactor all related code.

## Change Expectations
- Prefer focused edits over broad rewrites.
- Do not introduce new frameworks or state libraries unless explicitly requested.
- If implementing backend persistence or auth, update README roadmap notes as part of the same change.

## Useful References
- Internal docs: ../README.md
- Next.js App Router docs: https://nextjs.org/docs/app
- Dynamic routes and generateStaticParams: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- Next.js typedRoutes option: https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes
- Tailwind with Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict
- ESLint flat config: https://eslint.org/docs/latest/use/configure/configuration-files
