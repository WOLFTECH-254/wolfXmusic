# WOLFXmusic

A music streaming and discovery platform for browsing artists, albums, playlists, and favorites.

## Run & Operate

- `Start application` workflow — runs the React frontend (port 5000)
- `Start API server` workflow — runs the Express API server (port 8000)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS v4, Radix UI, TanStack Query, Wouter (routing), Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/wolfxmusic/` — React frontend app
- `artifacts/api-server/` — Express API server
- `lib/db/src/schema/` — DB schema (favorites, playlists)
- `lib/api-spec/` — OpenAPI spec + Orval config
- `lib/api-zod/` — Generated Zod schemas
- `lib/api-client-react/` — Generated TanStack Query hooks

## Architecture decisions

- Frontend proxies `/api` requests to the API server (port 8000) via Vite dev proxy
- The API server uses `PORT` env var; frontend uses both `PORT` and `BASE_PATH`
- Workflows use inline env vars: `PORT=5000 BASE_PATH=/ pnpm ... run dev` (frontend) and `PORT=8000 pnpm ... run dev` (API)
- DB schema pushed with `drizzle-kit push` (no migration files)

## Product

- Discover: browse featured artists and new music
- Search: find tracks, albums, artists
- Library: manage playlists and favorites
- Artist/Album detail pages

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Frontend workflow and API server workflow use different ports (5000 and 8000); set inline in the workflow command
- `BASE_PATH` env var is required by the Vite config
- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
