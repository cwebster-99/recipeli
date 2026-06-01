# Recipeli

Recipeli is a web-first recipe app inspired by the strongest Beli mechanic: expressing taste through rankings. It pairs a personal ranking board with social discovery, cookbook saving, and curated collections.

## Stack

- Next.js 16 (App Router)
- React 19 and TypeScript (strict)
- Tailwind CSS v4
- NextAuth (credentials) for authentication
- SQLite via `better-sqlite3` (database at `data/recipeli.db`)

## Features

- Email/password auth with per-user profiles ([src/app/login/page.tsx](src/app/login/page.tsx), [src/app/profile/page.tsx](src/app/profile/page.tsx))
- Landing page with ranking-first product pitch ([src/app/page.tsx](src/app/page.tsx))
- Discovery and trending feeds ([src/app/discover/page.tsx](src/app/discover/page.tsx), [src/app/explore/page.tsx](src/app/explore/page.tsx))
- Personal ranking flow with pairwise comparisons ([src/components/rank-flow.tsx](src/components/rank-flow.tsx), [src/components/comparison-panel.tsx](src/components/comparison-panel.tsx), [src/lib/ranking.ts](src/lib/ranking.ts))
- Recipe detail pages with save, like, and ranking actions ([src/app/recipes/[slug]/page.tsx](src/app/recipes/%5Bslug%5D/page.tsx), [src/components/recipe-actions.tsx](src/components/recipe-actions.tsx))
- Cookbook of saved recipes ([src/app/cookbook/page.tsx](src/app/cookbook/page.tsx), [src/lib/cookbook.ts](src/lib/cookbook.ts))
- User-curated collections ([src/app/collections/page.tsx](src/app/collections/page.tsx), [src/app/collections/[id]/page.tsx](src/app/collections/%5Bid%5D/page.tsx), [src/lib/collections.ts](src/lib/collections.ts))
- Social graph: follow users, like recipes, view public profiles ([src/app/u/[handle]/page.tsx](src/app/u/%5Bhandle%5D/page.tsx), [src/lib/social.ts](src/lib/social.ts))
- URL-assisted recipe submission with server-side import ([src/app/submit/page.tsx](src/app/submit/page.tsx), [src/app/api/recipes/import/route.ts](src/app/api/recipes/import/route.ts), [src/lib/recipe-import.ts](src/lib/recipe-import.ts))

## Project layout

- `src/app/` — App Router pages and REST-style API handlers under `src/app/api/`
- `src/components/` — shared React components (cards, nav, rank flow, action buttons)
- `src/lib/` — domain logic and SQLite access ([db.ts](src/lib/db.ts), [auth.ts](src/lib/auth.ts), [recipes.ts](src/lib/recipes.ts), [ranking.ts](src/lib/ranking.ts), [cookbook.ts](src/lib/cookbook.ts), [collections.ts](src/lib/collections.ts), [social.ts](src/lib/social.ts), [recipe-import.ts](src/lib/recipe-import.ts), [users.ts](src/lib/users.ts), [password.ts](src/lib/password.ts))
- `src/types/` — type augmentations (e.g. NextAuth session)
- `data/` — SQLite database files (created at runtime)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Environment variables needed for auth:

- `NEXTAUTH_SECRET` — required by NextAuth
- `NEXTAUTH_URL` — e.g. `http://localhost:3000` in development

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — ESLint (the main automated quality gate; no test script yet)

## URL import notes

- Recipe imports run server-side and prioritize schema.org Recipe JSON-LD when available.
- If structured schema is missing, metadata and HTML heuristics provide best-effort field extraction.
- Imported recipes are persisted to the SQLite database alongside user-created recipes.

## Roadmap

1. Add automated tests around ranking, import, and social flows.
2. Replace SQLite with a hosted database for multi-instance deployments.
3. Expand social features (comments, activity feed, notifications).
4. Richer recipe editing and media uploads on the submit flow.
