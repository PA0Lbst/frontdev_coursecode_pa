# Tasks: Workout Tracking UI

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Do not edit `src/actions/workoutSession/*`, `src/actions/workoutSet/*`, or `prisma/schema.prisma` — owned by `010-workout-backend`. Do not add new Server Action files under `src/actions/` (the only new server-side code is the inline bound closure in `page.tsx`). No new npm packages.

## 1. Remove the todo UI

- [x] Delete `src/components/molecules/TodoForm/` (component, stories, test).
- [x] Delete `src/components/molecules/TodoItem/` (component, stories, test).
- [x] Delete `src/components/organisms/TodoList/` (component, stories, test).
- [x] Delete `src/components/pages/TodoPage/` (component, stories, test).
- [x] Delete `tests/e2e/todo.spec.ts`.

## 2. `WorkoutSetForm`

- [x] Create `src/components/molecules/WorkoutSetForm/WorkoutSetForm.tsx` (`"use client"`), props `{ onAdd }`.
- [x] Fields: Exercise (`Input`, text), Reps (`Input type="number"`), Weight (kg) (`Input type="number"`). Ids: `workout-set-form-exercise`, `workout-set-form-reps`, `workout-set-form-weight`.
- [x] Inline validity check (trimmed exercise non-empty, `Number.isInteger(parsedReps)`, `Number.isFinite(parsedWeight)`); no shared validation helper file.
- [x] Submit calls `onAdd({ exercise, reps, weight })` with parsed numbers; clears all fields on success; `adding` state disables Add during the call.
- [x] Add button `disabled={!isValid || adding}`.
- [x] Dual export (`{ WorkoutSetForm }` + default).
- [x] `WorkoutSetForm.stories.tsx`: CSF3, `title: "Molecules/WorkoutSetForm"`, `layout: "centered"`, `tags: ["autodocs"]`, `onAdd: fn()` disabled in controls table, `Default` story with a `play` that fills Exercise/Reps/Weight and clicks Add.
- [x] `WorkoutSetForm.test.tsx`: Add disabled + `aria-disabled` when empty; filling all three fields and submitting calls `onAdd` with numeric `reps`/`weight`.

## 3. `WorkoutSetItem`

- [x] Create `src/components/molecules/WorkoutSetItem/WorkoutSetItem.tsx` (`"use client"`), props `{ set, onUpdate, onDelete }` (`set: WorkoutSet` from `@/generated/prisma/browser`).
- [x] Read view: exercise, `"{reps} × {weight} kg"`, `createdAt.toLocaleDateString("en-US")`, Edit/Delete buttons (`size="sm"`, `variant="secondary"`).
- [x] Edit view: same three fields as `WorkoutSetForm`, pre-filled from `set`, ids `workout-set-item-{field}-${set.id}`; Save calls `onUpdate({ ...set, exercise, reps, weight })` and exits edit mode on success; Cancel discards without calling anything.
- [x] Same `saving`/`deleting` disabled-state pattern as the old `TodoItem`.
- [x] Dual export.
- [x] `WorkoutSetItem.stories.tsx`: `title: "Molecules/WorkoutSetItem"`, `layout: "centered"`, sample set fixture, `play` clicks "Edit".
- [x] `WorkoutSetItem.test.tsx`: read view shows exercise/reps/weight; Edit → change values → Save calls `onUpdate` with the merged, correctly-typed set.

## 4. `WorkoutSetList`

- [x] Create `src/components/organisms/WorkoutSetList/WorkoutSetList.tsx` (`"use client"`), props `{ sets, onAdd, onUpdate, onDelete }`.
- [x] Renders `WorkoutSetForm` then `{sets.length === 0 ? <p>No sets yet.</p> : null}` then `<ul>` of `WorkoutSetItem` (`key={set.id}`).
- [x] Dual export.
- [x] `WorkoutSetList.stories.tsx` / `.test.tsx`: mirror old `TodoList` story/test structure with the sample sets fixture.

## 5. `WorkoutPage`

- [x] Create `src/components/pages/WorkoutPage/WorkoutPage.tsx` (`"use client"`), props `{ initialSets?, createSet, updateSet, deleteSet }`.
- [x] `toClientSet` coerces `createdAt` to `Date`; initial state reverses `initialSets` (backend gives oldest-first) so display is newest-first.
- [x] `onAdd`/`onUpdate`/`onDelete` call the respective prop, update local state only on success (prepend / replace-by-id / filter-by-id), set the generic `role="alert"` message and rethrow on failure, clear the alert on the next success — same as old `TodoPage`.
- [x] Renders `PageTemplate` > `mx-auto w-full max-w-2xl` container > conditional alert `<p role="alert">` > `WorkoutSetList`.
- [x] Dual export.
- [x] `WorkoutPage.stories.tsx`: `title: "Pages/WorkoutPage"`, `layout: "fullscreen"`, mocked `createSet`/`updateSet`/`deleteSet` via `fn()`, sample sets, `play` adds a set and asserts it's visible.
- [x] `WorkoutPage.test.tsx`: empty state shows "No sets yet.", Add button, and "Workoutish" heading; non-empty `initialSets` renders those exercises; add-from-empty makes the new exercise visible and removes the empty message.

## 6. Header rename

- [x] `Header.tsx`: change `<h1>` text from "Todoish" to "Workoutish".
- [x] Update `Header.stories.tsx` / `Header.test.tsx` if either asserts "Todoish".

## 7. App wiring (`src/app/page.tsx`)

- [x] Import `createSession`, `listSessions` (workoutSession) and `createSet`, `updateSet`, `deleteSet` (workoutSet) directly by file path; import `WorkoutPage`.
- [x] Keep `export const dynamic = "force-dynamic"`.
- [x] Resolve `sessions = await listSessions()`; `currentSession = sessions[0] ?? (await createSession({}))`; `initialSets = sessions[0]?.sets ?? []`.
- [x] Define `addSet` as a function-level `"use server"` closure inside `Home` that calls `createSet({ sessionId: currentSession.id, ...input })` — no other logic in it, and it is not a new file under `src/actions/`.
- [x] Render `<WorkoutPage initialSets={initialSets} createSet={addSet} updateSet={updateSet} deleteSet={deleteSet} />`.

## 8. E2e

- [x] Create `tests/e2e/workout.spec.ts`: unique exercise name (`` `e2e-set-${Date.now()}` ``); add → assert visible → reload → edit exercise name → assert edited → reload → delete → assert gone → reload → assert still gone; assert "Workoutish" heading at the start. Uses `prisma/dev.db`; does not wipe the DB.

## Verify

- [x] `npx tsc --noEmit` (or project equivalent) passes.
- [x] `npm test` passes (Storybook, components, and actions Vitest projects — actions project should be unaffected since backend files are untouched).
- [x] `npm run test:e2e` passes.
- [x] No remaining references to `Todo`/`TodoForm`/`TodoItem`/`TodoList`/`TodoPage`/"Todoish" anywhere under `src/` or `tests/` (grep to confirm).
- [x] Manually load `/`, add a set, edit it, delete it, and confirm no session concept is ever visible in the UI.
