# Tasks: Home Cards & Mobile-Friendly Create

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Do not add npm packages. Do not edit `prisma/schema.prisma` or `src/generated/prisma`. Do not change `Input`/`Button` props or behavior (class maps only) or `PageTemplate`. Do not add Route Handlers, `revalidatePath`, or `router.refresh`. Do not change any action or the 013 spec files. Components must not import `@/actions/...` or Prisma.

## 1. Label helpers

- [x] Add exported `formatWorkoutDate(date)` (UTC `DD/MM/YYYY`) to `src/data/workoutLabel.ts`.
- [x] Change `workoutLabel` to return `name` or `Untitled workout`.

## 1b. Softer buttons and inputs

- [x] `Button.tsx`: switch to `rounded-full` (keep `transition-colors active:scale-[0.98]`, `shadow-sm` on `primary`).
- [x] `Input.tsx`: add `rounded-lg transition-colors hover:border-zinc-400 focus-visible:border-black`.
- [x] Confirm existing Button/Input tests and stories still pass.

## 2. `WorkoutCard`

- [x] Create `WorkoutCard.tsx` (`"use client"`, named + default export): single `next/link` to `/workouts/[id]` with title, date, and exercise count (singular/plural); top-right round borderless `⋯` menu button (native `<button>`, no gray fill, hover fill only) (`aria-label="Actions for <label>"`, `aria-haspopup`, `aria-expanded`) opening a menu with a red trash `Delete` menuitem (immediate delete, closes on outside click/Escape/choice, disabled while `deleting`); hover shadow and link focus outline.
- [x] Create `WorkoutCard.stories.tsx` (`Molecules/WorkoutCard`, centered, autodocs, curated controls, one `Default` with `play`).
- [x] Create `WorkoutCard.test.tsx` (href, label/date, pluralization, menu open/Delete/Escape, disabled).

## 3. `WorkoutListPage`

- [x] Export `WorkoutSessionSummary`; keep `setCount` in state; new sessions get `setCount: 0`.
- [x] Rework create form: placeholder `Workout name (optional)`, `autoComplete="off"`, `enterKeyHint="done"`, `min-h-11 text-base` input, `Add workout` button full-width on phones and inline from `sm`.
- [x] Render list as `grid grid-cols-1 sm:grid-cols-2` of `WorkoutCard`.
- [x] Update `WorkoutListPage.test.tsx` (`Add workout`, `Untitled workout`, regex link names, `0 exercises` on create).
- [x] Update `WorkoutListPage.stories.tsx` (`setCount` in samples, `Add workout`, regex link name).

## 4. Home route

- [x] Update `src/app/page.tsx` to pass `{ ...session, setCount: sets.length }` rows; remove `void sets`.

## 5. E2E

- [x] Update `tests/e2e/workout.spec.ts` for `Add workout` and partial link names.
- [x] Add a 375×667 viewport test: create → tap card → back → `Actions for <name>` → `Delete`.

## Verify

- [x] `npx tsc --noEmit` passes.
- [x] `npm test` passes.
- [x] `npm run test:e2e` passes.
- [x] Check `/` at 320px and 375px: no horizontal scroll, title not overlapped by Delete, cards tappable, form usable one-handed.
