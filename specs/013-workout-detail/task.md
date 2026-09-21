# Tasks: Workout Detail

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Do not add npm packages. Do not edit `prisma/schema.prisma` or `src/generated/prisma`. Do not add Route Handlers, `revalidatePath`, or `router.refresh`. Do not change `createSession`, `listSessions`, `deleteSession`, or the set actions. Components must not import `@/actions/...` or Prisma.

## 1. Shared helpers and backend

- [x] Create `src/data/workoutLabel.ts`: `workoutLabel({ name, createdAt })` → `name` or `Workout of DD/MM/YYYY` (UTC components).
- [x] Create `src/actions/workoutSession/getSession/getSession.ts` (`"use server"`, single named export, session + sets asc by `createdAt`, `null` if missing).
- [x] Create `tests/actions/workoutSession/getSession/getSession.test.ts` (found with sets / unknown id → `null`).

## 2. `WorkoutPage`

- [x] Add required `title: string` prop; render `<h2>` with it and a `next/link` `Back to workouts` → `/`.
- [x] Update `WorkoutPage.test.tsx`: pass `title`, assert title and back link `href="/"`.
- [x] Update `WorkoutPage.stories.tsx`: add `title` arg (hide from controls like other props).

## 3. Detail route

- [x] Create `src/app/workouts/[id]/page.tsx`: `force-dynamic`, `await params`, non-integer id or `null` session → `notFound()`, inline `"use server"` `addSet` bound to `sessionId`, render `WorkoutPage` with `title={workoutLabel(session)}`.

## 4. `WorkoutListPage`

- [x] Create `WorkoutListPage.tsx`: props `initialSessions`, `createSession`, `deleteSession`; create form (optional name), list with `next/link` per workout, `Delete` button per item, empty message `No workouts yet.`.
- [x] State per `AGENTS.md`: prepend on create, remove on delete, coerce `createdAt`, generic `role="alert"` error + rethrow, clear on success, native `disabled` while pending, no refetch.
- [x] Create `WorkoutListPage.stories.tsx` (`Pages/WorkoutListPage`, fullscreen, autodocs, one `Default` with `play`).
- [x] Create `WorkoutListPage.test.tsx` (empty, labels + hrefs, create, delete, error cases; `vi.fn()` props only).

## 5. Home route

- [x] Rewrite `src/app/page.tsx`: `force-dynamic`, `listSessions` mapped to rows without `sets`, render `WorkoutListPage` with `createSession` and `deleteSession`. Remove auto-created session and `addSet`.

## 6. E2E

- [x] Update `tests/e2e/workout.spec.ts`: create uniquely named workout → open → add/edit/delete exercise (use `page.reload()` inside the workout) → back to `/` → delete the workout (and after reload).

## Verify

- [x] `npx tsc --noEmit` passes.
- [x] `npm test` passes.
- [x] `npm run test:e2e` passes.
