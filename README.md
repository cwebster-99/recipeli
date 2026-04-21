# Recipeli!

Recipeli is a web-first recipe tracking app inspired by the strongest Beli mechanic: expressing taste through rankings. The first implementation in this repository focuses on discovery, recipe detail, a personal ranking board, and the opening shell of a user-submitted recipe flow.

## Current stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS v4
- Local in-repo sample data for recipes and ranking state

- anothjer change 

## Current product slice

- Landing page with product positioning and ranking-first UI
- Discovery queue for saved and cooked recipes that are not ranked yet
- Personal top-recipe leaderboard
- Recipe detail pages generated from local domain data
- URL-assisted submission flow with best-effort recipe parsing and editable fields before save

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Next implementation targets

1. Add authentication and per-user profile state.
2. Move recipes, saves, ratings, and ranking entries into a real database.
3. Persist imported and user-created recipes beyond in-memory runtime state.
4. Add save, cooked, and re-rank interactions on the recipe detail page.

## URL import notes

- Recipe imports run server-side and prioritize schema.org Recipe JSON-LD when available.
- If structured schema is missing, metadata and HTML heuristics provide best-effort field extraction.
- Imported recipes are stored in-memory in the current app process and reset after server restart.
