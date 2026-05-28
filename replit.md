# WOLFXmusic

A music streaming and discovery platform for browsing artists, albums, playlists, and favorites.

## Run & Operate

- `artifacts/wolfxmusic: web` workflow — runs the React frontend (port auto-assigned by platform, defaults to 5000)
- `artifacts/api-server: API Server` workflow — runs the Express API server (port 8080)
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

- Frontend proxies `/api` requests to the API server (port 8080) via Vite dev proxy
- The API server uses `PORT` env var (hardcoded to 8080 in dev script)
- Frontend PORT is injected by Replit's artifact workflow system; BASE_PATH defaults to "/"
- DB schema pushed with `drizzle-kit push` (no migration files)

## Product

- Discover: browse featured artists and new music
- Search: find tracks, albums, artists
- Library: manage playlists and favorites
- Artist/Album detail pages

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Frontend workflow port is injected by the Replit artifact system (don't hardcode PORT= in the dev script)
- API server uses PORT=8080 (hardcoded in dev script); Vite proxy points to localhost:8080
- `BASE_PATH` defaults to "/" in vite.config.ts if not set
- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
