# Workout Backend — Tasks

Source: [`./plan.md`](./plan.md), [`./spec.md`](./spec.md).

Hard constraints:
- Do not touch `src/components`, `src/app`, or anything UI-related — this is backend only (see `011-workout-ui`).
- Do not hand-write migration SQL; generate it with `prisma migrate dev`.
- `deleteSession` / `deleteSet` rely on Prisma's own "not found" throw (`P2025`) — do not add a manual existence check before delete.

## Schema & migration

- [x] Replace the `Todo` model in `prisma/schema.prisma` with `WorkoutSession` and `WorkoutSet` (fields and relation per `plan.md`).
- [x] Run `npx prisma migrate dev --name workout_sessions_and_sets` to generate and apply the migration to `prisma/dev.db`.
- [x] Run `npx prisma generate`.

## Remove todo backend

- [x] Delete `src/actions/todo/` (all actions + `helpers.ts`).
- [x] Delete `tests/actions/todo/`.

## Server Actions — workoutSet

- [x] Add `src/actions/workoutSet/helpers.ts` (`parseSetFields`): trims `exercise` (throw if empty after trim), requires `reps` to be an integer `>= 1`, requires `weight` to be finite and `>= 0`.
- [x] Add `src/actions/workoutSet/createSet/createSet.ts`: validate via `parseSetFields`, verify `sessionId` exists (throw if not), insert, return created row.
- [x] Add `src/actions/workoutSet/updateSet/updateSet.ts`: validate via `parseSetFields`, update `exercise`/`reps`/`weight` for `id` only (never `sessionId`), return updated row.
- [x] Add `src/actions/workoutSet/deleteSet/deleteSet.ts`: delete by `id`, return `void`.

## Server Actions — workoutSession

- [x] Add `src/actions/workoutSession/createSession/createSession.ts`: trim optional `name` inline (blank → `null`), insert, return created row.
- [x] Add `src/actions/workoutSession/listSessions/listSessions.ts`: return sessions newest-first, each with `sets` included oldest-first.
- [x] Add `src/actions/workoutSession/deleteSession/deleteSession.ts`: delete by `id`, return `void` (sets cascade-delete via the schema relation).

## Tests

- [x] Update `tests/actions/setup.ts` to wipe `workoutSet` then `workoutSession` in `beforeEach` instead of `todo`.
- [x] Add `tests/actions/workoutSet/createSet/createSet.test.ts`: persists + returns generated `id`/`createdAt`; trims `exercise`; rejects empty exercise, `reps < 1`, and negative `weight` without writing a row; rejects an unknown `sessionId`.
- [x] Add `tests/actions/workoutSet/updateSet/updateSet.test.ts`: updates and returns the saved row; unknown `id` throws.
- [x] Add `tests/actions/workoutSet/deleteSet/deleteSet.test.ts`: removes the row; unknown `id` throws.
- [x] Add `tests/actions/workoutSession/createSession/createSession.test.ts`: persists + returns generated fields; trims `name`; blank name becomes `null`.
- [x] Add `tests/actions/workoutSession/listSessions/listSessions.test.ts`: returns sessions newest-first, each with sets ordered oldest-first.
- [x] Add `tests/actions/workoutSession/deleteSession/deleteSession.test.ts`: removes the session and cascades its sets; unknown `id` throws.

## AGENTS.md

- [x] Update the Backend section's canonical example to `src/actions/workoutSet/createSet/createSet.ts`.
- [x] Replace the "Todo helper example" paragraph with the `parseSetFields` equivalent, and note `workoutSession` has no helpers file (only one action needs field parsing).

## Verify

- [x] `npm run test` passes (all Vitest projects, including `actions`). The `actions` project: 6 files, 14/14 tests passed. The `storybook`/`components` browser projects errored before running any test — pre-existing environment issue (Playwright's Chromium binary isn't installed on this machine, `npx playwright install` needed), unrelated to this change.
- [x] Manual query confirms `WorkoutSession` / `WorkoutSet` tables exist on `dev.db` and `Todo` is gone (`sqlite3 prisma/dev.db "SELECT name FROM sqlite_master WHERE type='table'"`).
- [x] No remaining references to `Todo`, `todo`, or `parseTodoFields` in `src/actions/` or `tests/actions/` (confirmed via grep). Note: this item's wording said "anywhere in `src/`", but the hard constraint above (backend only, don't touch `src/components`/`src/app`) takes precedence — `src/app/page.tsx` and the todo UI components still reference the old actions/model until `011-workout-ui` is executed. Until then, `npm run dev`/`build` and `tests/e2e/todo.spec.ts` will fail; that's expected.
