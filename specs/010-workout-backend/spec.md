# Workout Backend

## Context

- Sample app for illustration; keep APIs simple.
- Pivots the app's domain from the todo list to a single-user gym workout tracker. The `Todo` model, `src/actions/todo/`, and `tests/actions/todo/` are removed as part of this spec.
- Two new Prisma models (`prisma/schema.prisma`):
  - `WorkoutSession`: `id` (`Int`, autoincrement), `createdAt` (`DateTime`, default `now()`), `name` (`String?`, optional label).
  - `WorkoutSet`: `id` (`Int`, autoincrement), `sessionId` (`Int`, FK → `WorkoutSession.id`, `onDelete: Cascade`), `createdAt` (`DateTime`, default `now()`), `exercise` (`String`), `reps` (`Int`), `weight` (`Float`, kilograms).
- A session is just a timestamped container: no open/closed status, no "end session" action. There is no calendar/date grouping beyond `createdAt`.
- Prisma client singleton: `src/prisma/prismaClient.ts` (reads `DATABASE_URL`, default `file:./prisma/dev.db`). Generated client: `src/generated/prisma`.
- No User model, no auth. One global set of sessions, same as the todo list was one global list.
- `AGENTS.md` documents backend conventions (Server Actions layout, thin Prisma, helpers file, action tests) written for the todo domain; this spec re-points those conventions at the workout domain.

## Goals

- Replace the `Todo` Prisma model with `WorkoutSession` and `WorkoutSet` (one-to-many) and add a migration.
- Server Actions to create/list/delete sessions, and to create/update/delete sets within a session.
- Thin actions that call Prisma directly (no service or repository layer).
- Vitest node tests for those actions, against a dedicated SQLite file.
- Update `AGENTS.md` backend section for the new domain (same conventions, new names).

## Requirements

### Scope
- Replace the `Todo` model with `WorkoutSession` and `WorkoutSet` in `prisma/schema.prisma`; add a new Prisma migration (do not edit the existing `init_todos` migration).
- Remove `src/actions/todo/` and `tests/actions/todo/` entirely.
- Add the Server Actions below (and only those), the shared helpers file, plus Vitest node tests for each action under `tests/`.
- Do not wire the UI, `src/app/page.tsx`, layouts, routes, or e2e (covered by the follow-up UI spec, `011-workout-ui`).
- Do not add Route Handlers / REST endpoints.
- Do not add a service or repository layer.
- Do not add new npm packages.
- No session rename after creation (no `updateSession`). No session open/closed state.

### Folder & files
- Actions live under two resources, one folder per action named after the exported function. The action file matches the folder:
  - `src/actions/workoutSession/createSession/createSession.ts`
  - `src/actions/workoutSession/listSessions/listSessions.ts`
  - `src/actions/workoutSession/deleteSession/deleteSession.ts`
  - `src/actions/workoutSet/createSet/createSet.ts`
  - `src/actions/workoutSet/updateSet/updateSet.ts`
  - `src/actions/workoutSet/deleteSet/deleteSet.ts`
- Each action file starts with `"use server"`. Runtime export is one async named function (no default export).
- Required helpers file: `src/actions/workoutSet/helpers.ts`. Not a Server Action (no `"use server"`). Named export `parseSetFields` only, shared by `createSet` and `updateSet`.
- `workoutSession` has no helpers file: `createSession` trims `name` inline (only one action needs it).
- No barrel files (`index.ts`) at any actions level. Import the file directly, e.g. `@/actions/workoutSet/createSet/createSet`.
- Do not add a service/repo folder or extra layers.
- Tests live under `tests/actions/`, mirroring the action folders, e.g. `tests/actions/workoutSet/createSet/createSet.test.ts`.

### Data
- `WorkoutSession` row: `{ id: number; createdAt: Date; name: string | null }`.
- `WorkoutSet` row: `{ id: number; sessionId: number; createdAt: Date; exercise: string; reps: number; weight: number }`.
- `id` and `createdAt` are Prisma-generated on both models. Callers must not supply them on create. No action changes `id`, `createdAt`, or `sessionId` after creation.
- `createSession` input: `{ name?: string | null }`. If provided, trim `name`; empty after trim becomes `null`.
- Input rules for sets, implemented in `parseSetFields` (`src/actions/workoutSet/helpers.ts`) and used by `createSet` and `updateSet`:
  - Args: `{ exercise: string; reps: number; weight: number }`.
  - Trim `exercise`. After trim, empty `exercise` is invalid — throw. Do not write the row.
  - `reps` must be an integer `>= 1` — throw otherwise.
  - `weight` must be a finite number `>= 0` — throw otherwise (0 covers bodyweight exercises).
  - Return `{ exercise: string; reps: number; weight: number }`.
- Throws are ordinary exceptions. Tests assert rejection only — not a specific class or message.

### Server Actions

#### `createSession`
- Location: `src/actions/workoutSession/createSession/createSession.ts`.
- Args: `{ name?: string | null }`.
- Trims `name` as described above, then inserts via Prisma. Returns the created `WorkoutSession`.

#### `listSessions`
- Location: `src/actions/workoutSession/listSessions/listSessions.ts`.
- Args: none.
- Returns sessions newest-first (`createdAt` descending), each including its sets ordered oldest-first (`createdAt` ascending — the order they were logged in): `(WorkoutSession & { sets: WorkoutSet[] })[]`.

#### `deleteSession`
- Location: `src/actions/workoutSession/deleteSession/deleteSession.ts`.
- Args: `id: number`.
- Deletes the session; its sets cascade-delete via the Prisma relation (`onDelete: Cascade`), not manual per-row deletion in the action. Returns `void`.
- If no row exists for `id`, throw.

#### `createSet`
- Location: `src/actions/workoutSet/createSet/createSet.ts`.
- Args: `{ sessionId: number; exercise: string; reps: number; weight: number }`.
- Run `parseSetFields` on `exercise` / `reps` / `weight`. If no `WorkoutSession` exists for `sessionId`, throw (do not create one implicitly). Insert via Prisma. Returns the created `WorkoutSet`.
- "Add to the most recent session" is a UI-level choice (the caller passes the latest session's `id`, e.g. from `listSessions()[0].id`); this action does not look up "the latest session" itself.

#### `updateSet`
- Location: `src/actions/workoutSet/updateSet/updateSet.ts`.
- Args: `{ id: number; exercise: string; reps: number; weight: number }`.
- Run `parseSetFields` on `exercise` / `reps` / `weight`. Update only those fields for that `id` (never `sessionId`).
- If no row exists for `id`, throw. Do not create a row.
- Returns the updated `WorkoutSet`.

#### `deleteSet`
- Location: `src/actions/workoutSet/deleteSet/deleteSet.ts`.
- Args: `id: number`.
- Deletes the row. Returns `void`.
- If no row exists for `id`, throw.

### Conventions
- Call the existing `prisma` singleton from `@/prisma/prismaClient`. Do not change its default URL.
- No `revalidatePath` / `revalidateTag` / cache APIs (nothing in `src/app` consumes these actions yet).
- No extra validation library (no Zod, etc.).
- TypeScript: existing project `tsconfig` only.

### Tests
- Reuse the existing Vitest **node** project (`tests/actions/**/*.test.ts`). Do not run these through the Storybook or components browser projects. Do not run `tests/e2e` through Vitest.
- Place tests under `tests/actions/`, mirroring each action folder:
  - `tests/actions/workoutSession/createSession/createSession.test.ts`
  - `tests/actions/workoutSession/listSessions/listSessions.test.ts`
  - `tests/actions/workoutSession/deleteSession/deleteSession.test.ts`
  - `tests/actions/workoutSet/createSet/createSet.test.ts`
  - `tests/actions/workoutSet/updateSet/updateSet.test.ts`
  - `tests/actions/workoutSet/deleteSet/deleteSet.test.ts`
- Import the named action with `@/`, e.g. `import { createSet } from "@/actions/workoutSet/createSet/createSet"`. Do not colocate action tests under `src/`.
- Do not add Testing Library or jsdom.
- Dedicated DB: `prisma/test.db` (existing setup). Apply the new schema/migrations to it so `WorkoutSession` / `WorkoutSet` exist. Do not read or write `prisma/dev.db` from these tests.
- Wipe all `WorkoutSet` and `WorkoutSession` rows before each test. Do not run node tests in parallel against that file (SQLite).
- Minimum cases:
  - `createSession`: persists and returns a session with generated `id` / `createdAt`; trims `name`; blank name becomes `null`.
  - `listSessions`: returns sessions newest-first, each with its sets ordered oldest-first.
  - `deleteSession`: removes the session and its sets (cascade); unknown `id` throws.
  - `createSet`: persists and returns a `WorkoutSet` with generated `id` / `createdAt`; trims `exercise`; rejects empty exercise, reps `< 1`, and negative weight without writing a row; unknown `sessionId` throws.
  - `updateSet`: updates exercise/reps/weight and returns the saved `WorkoutSet`; unknown `id` throws.
  - `deleteSet`: removes the row; unknown `id` throws.

### AGENTS.md
- Replace the todo-specific wording in the backend section with the workout domain (same structural conventions: `src/actions/{resource}/{actionName}/{actionName}.ts`, `"use server"`, named export only, no barrels, thin Prisma, shared helpers file only where more than one action needs it, no Route Handlers, Vitest node tests under `tests/actions/{resource}/{actionName}/{actionName}.test.ts` against `prisma/test.db`).
- Canonical example: `src/actions/workoutSet/createSet/createSet.ts`.

## Out of scope

- Wiring `WorkoutPage` or any UI to these actions (see `011-workout-ui`).
- Route Handlers / REST.
- Get-by-id for sessions or sets.
- Auth, User model, per-user logs.
- Session rename/update, open/closed session state, "end session" action.
- Letting the client choose which session a set attaches to beyond passing a `sessionId` it already has (no session-picker logic in the backend).
- Exercise catalog or autocomplete, units other than kilograms, per-exercise history or personal-best calculation.
- Service or repository layer.
- Changing `src/app/page.tsx`, layouts, or Playwright e2e.
- Changing shared UI components or their tests/stories.
- Dark mode, design tokens, extra validation libraries.
- `revalidatePath` / cache invalidation.
- Custom error classes or fixed error messages.
