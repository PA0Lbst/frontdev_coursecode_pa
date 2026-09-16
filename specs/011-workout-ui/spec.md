# Workout Tracking UI

## Context

- Replaces the todo UI (`TodoForm`, `TodoItem`, `TodoList`, `TodoPage`) with a workout-log equivalent, wired to the Server Actions from `010-workout-backend` (`createSet`, `updateSet`, `deleteSet`, `listSessions`, `createSession`).
- Sessions (`WorkoutSession`) are an implementation detail, not a UI concept: there is no session picker, no "new session" button, and no per-session grouping in the UI. The app always logs sets into one ongoing session and shows only that session's sets, exactly like the single global todo list.
- `deleteSession` and multi-session listing are not used by this UI at all.
- The app's display name changes from "Todoish" to "Workoutish" (`Header.tsx`'s `<h1>`), since the domain has fully pivoted.
- `tests/e2e/todo.spec.ts` (asserts the "Todoish" heading, Title/Description fields, todo add/edit/delete) is replaced by an equivalent workout e2e spec.

## Goals

- Shared UI to log, edit, and delete a set (exercise, reps, weight), replacing the todo components 1:1 in the atomic-design tree.
- Wire `/` to that UI and the workout Server Actions so it persists, transparently reusing (or lazily creating) the one ongoing session.
- Update `Header` and the e2e suite to match the new domain.

## Requirements

### Scope

- Remove `TodoForm`, `TodoItem`, `TodoList`, `TodoPage` (files, stories, tests) and add their workout equivalents (below). `PageTemplate`, `Footer`, `Button`, `Input`, `Textarea` are unchanged and reused as-is.
- `Textarea` is not used by the new components (no free-text field in a set).
- Update `Header.tsx` (and its story/test) to render "Workoutish" instead of "Todoish".
- Update `src/app/page.tsx` to load and wire the workout actions instead of the todo actions.
- Replace `tests/e2e/todo.spec.ts` with `tests/e2e/workout.spec.ts`.
- Do not modify `src/actions/workoutSession/*`, `src/actions/workoutSet/*`, `prisma/schema.prisma`, or their tests (owned by `010-workout-backend`).
- Do not add new Server Action files. `page.tsx` may define one inline Server Action (see "Session handling" below) purely to bind the session id; it must not contain business logic beyond calling `createSet`.

### Components

New components, replacing the todo ones with the same folder/file conventions (`ComponentName/ComponentName.tsx` + `.stories.tsx` + `.test.tsx`, named + default export, no barrels):

- `src/components/molecules/WorkoutSetForm/WorkoutSetForm.tsx` — replaces `TodoForm`. Fields: exercise (text), reps (number), weight (number).
- `src/components/molecules/WorkoutSetItem/WorkoutSetItem.tsx` — replaces `TodoItem`. Displays one set; toggles into an edit form for the same three fields.
- `src/components/organisms/WorkoutSetList/WorkoutSetList.tsx` — replaces `TodoList`. Renders `WorkoutSetForm` plus the list of `WorkoutSetItem`s.
- `src/components/pages/WorkoutPage/WorkoutPage.tsx` — replaces `TodoPage`.

Row type for all of these: `WorkoutSet` from `@/generated/prisma/browser`, i.e. `{ id: number; sessionId: number; createdAt: Date; exercise: string; reps: number; weight: number }`.

### `WorkoutSetForm`

- Props: `onAdd: (item: { exercise: string; reps: number; weight: number }) => void | Promise<void>`.
- Fields in order: "Exercise" (`Input`, text), "Reps" (`Input type="number"`), "Weight (kg)" (`Input type="number"`), matching the label/`htmlFor` pattern `TodoForm` used (`id="workout-set-form-exercise"`, etc.).
- Local state holds the raw string values from the number inputs; on submit, parse with `Number(...)`.
- Client-side guard before calling `onAdd` (mirrors `TodoForm`'s trim-and-check-empty guard): trim `exercise`, block submit when trimmed `exercise` is empty, `reps` does not parse to a finite integer, or `weight` does not parse to a finite number. On any of these, don't call `onAdd`. (The backend still re-validates; this is just to avoid pointless round-trips.) Do not duplicate the backend's `>= 1` / `>= 0` range checks here — a bad value goes to the server, fails, and surfaces the shared inline alert like any other action failure.
- Submit button disabled when the client-side guard would block, or while `onAdd` is pending (same `adding` state pattern as `TodoForm`). On success, clear all three fields.

### `WorkoutSetItem`

- Props: `set: WorkoutSet`, `onUpdate: (set: WorkoutSet) => void | Promise<void>`, `onDelete: (id: number) => void | Promise<void>`.
- Read view: exercise name, `reps × weight kg` (e.g. "8 × 60 kg"), `createdAt` formatted with `toLocaleDateString("en-US")` (same as `TodoItem`), Edit/Delete buttons — same layout and sizing (`size="sm"`, `variant="secondary"`) as `TodoItem`.
- Edit view: same three fields as `WorkoutSetForm`, pre-filled from `set`; Save calls `onUpdate` with `{ ...set, exercise, reps, weight }` (parsed the same way as the add form) and exits edit mode on success; Cancel discards changes without calling anything. Same disabled-while-saving / disabled-while-deleting behavior as `TodoItem`.

### `WorkoutSetList`

- Props: `sets: WorkoutSet[]`, `onAdd`, `onUpdate`, `onDelete` (same signatures as above).
- Renders `WorkoutSetForm` then `<ul>` of `WorkoutSetItem`s (`key={set.id}`). Empty state copy: "No sets yet." (replaces "No todos yet.").

### Session handling (hidden from the UI)

- `src/app/page.tsx` (Server Component) resolves the one ongoing session on every load: call `listSessions()`; if it returns at least one session, use `sessions[0]` (newest) and its `sets`; if it returns none, call `createSession({})` to create one and use `sets: []`.
- `page.tsx` passes `WorkoutPage` an `initialSets` array (that session's `sets`, oldest-first as returned) plus `updateSet` and `deleteSet` imported directly from their action files (unchanged signatures — no session id involved).
- For `createSet`, which requires `sessionId`, `page.tsx` defines and passes a small inline Server Action that closes over the resolved session id and forwards to `createSet`:
  ```ts
  async function addSet(input: { exercise: string; reps: number; weight: number }) {
    "use server";
    return createSet({ sessionId: currentSession.id, ...input });
  }
  ```
  This is required because Next only allows Server Actions (not arbitrary closures) to cross the Server→Client Component boundary as props; it is not a new persistent action file and contains no logic beyond the id binding. `WorkoutPage` and everything under it never see or pass around a `sessionId`.

### `WorkoutPage`

- Props: `initialSets?: WorkoutSet[]`, `createSet: (input: { exercise: string; reps: number; weight: number }) => Promise<WorkoutSet>`, `updateSet: (input: { id: number; exercise: string; reps: number; weight: number }) => Promise<WorkoutSet>`, `deleteSet: (id: number) => Promise<void>`.
- On init, coerce `createdAt` on every row to a `Date` (same `toClientSet` pattern as `TodoPage`'s `toClientTodo`) **and reverse `initialSets`** so the initial render is newest-first (the backend returns a session's sets oldest-first; the UI always displays newest-first).
- `onAdd`: call `createSet`, prepend the returned (coerced) set to state — same prepend-on-add behavior as `TodoPage`.
- `onUpdate` / `onDelete`: same replace-in-place / filter-out behavior as `TodoPage`, keyed on `id`.
- Same error handling as `TodoPage`: on any failure, leave state unchanged, set the generic `role="alert"` message ("Something went wrong. Try again."), rethrow so the child keeps its local UI; clear the alert on the next successful mutation.
- Renders `PageTemplate` > `WorkoutSetList`, same container styling (`mx-auto w-full max-w-2xl`) as `TodoPage`.

### App wiring (`src/app/page.tsx`)

- Keep `export const dynamic = "force-dynamic"`.
- Import `listSessions`, `createSession`, `createSet`, `updateSet`, `deleteSet` directly by file path (no barrels).
- Render `WorkoutPage` with `initialSets`, `createSet={addSet}` (the bound inline action above), `updateSet`, `deleteSet`.

### Header rename

- `Header.tsx`: change the `<h1>` text from "Todoish" to "Workoutish". No other change (still a Server Component, same classes).
- Update `Header.stories.tsx` / `Header.test.tsx` wherever they assert the old text.

### Tests & stories

- Every new/changed shared component gets its colocated `.stories.tsx` (CSF3, `tags: ["autodocs"]`, one `Default` story with a `play` interaction, `layout: "centered"` for molecules/organisms, `layout: "fullscreen"` for `WorkoutPage`) and `.test.tsx` (Vitest browser + `vitest-browser-react`), per `AGENTS.md`.
- `WorkoutPage`'s tests/stories mock `createSet`/`updateSet`/`deleteSet` with `fn()`; lower components use sync spies — same pattern `TodoPage` used.
- `tests/e2e/workout.spec.ts` replaces `tests/e2e/todo.spec.ts`: same shape (add → reload → edit → reload → delete → reload, each step asserting persistence), using a unique exercise name (e.g. `` `e2e-set-${Date.now()}` ``) instead of a unique title, and asserting the "Workoutish" heading. Uses `prisma/dev.db` per existing e2e conventions; does not wipe the DB.

## Out of scope

- Any session UI: session picker, "new session" action, multi-session or per-session grouping, `deleteSession`/`createSession` exposed to the client, session history.
- Prisma schema / Server Actions themselves (see `010-workout-backend`) — this spec only wires existing actions.
- Auth, exercise catalog/autocomplete, charts/history, units other than kilograms.
- Route Handlers, `revalidatePath`, `router.refresh`, optimistic/fake rows.
- Dark mode, design tokens, new npm packages.
