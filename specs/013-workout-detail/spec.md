# Workout Detail

## Context

- `WorkoutSession` / `WorkoutSet` models and actions `createSession`, `listSessions`, `deleteSession` (cascades sets), `createSet`, `updateSet`, `deleteSet` already exist.
- `/` currently renders `WorkoutPage` on the latest session (auto-created if none) via a bound `addSet` action.

## Goals

Create a workout, open it, and add exercises (sets) inside it, so each exercise belongs to one workout.

## Requirements

### Routes

- `/` becomes the workout list: newest first, create form (optional name, opens the workout on success), delete button per workout. No more auto-created session.
- New `/workouts/[id]`: shows that workout's sets (existing `WorkoutPage` behavior, moved here) with a link back to `/`. Non-numeric or unknown id → `notFound()`.
- Creating a workout redirects to `/workouts/[id]` of the new workout; the route injects a wrapper action that calls `createSession` then `redirect()`.
- Both routes: async Server Components, `force-dynamic`, actions passed as props.

### Backend

- New `workoutSession/getSession/getSession.ts`: returns the session with its sets (asc by `createdAt`), or `null` if missing.
- `createSession`, `listSessions`, `deleteSession` reused unchanged.
- `/workouts/[id]` injects `createSet` bound to that session id (same pattern as today's `addSet`); `updateSet`/`deleteSet` unchanged.

### UI

- New `WorkoutListPage` (pages layer): list, create form, delete; props `initialSessions`, `createSession`, `deleteSession`. Client state per AGENTS.md: create opens the new workout (no local prepend), remove on delete, coerce `createdAt`, generic `role="alert"` error, no refetch.
- A workout displays its `name`, or `Workout of <createdAt date>` when name is null (list and detail).
- Each list item links to `/workouts/[id]`.
- `WorkoutPage` gets the workout title and a back link (`/`); its existing props/behavior otherwise unchanged.

### Tests

- Action test for `getSession` (found / missing).
- Component tests + `Default` story for `WorkoutListPage`; update `WorkoutPage` tests/story for title and back link.
- Update `tests/e2e/workout.spec.ts`: create a workout (unique name) → lands on its page → add an exercise → it appears; back on `/`, delete the workout.

## Out of scope

- Renaming a workout, reordering, stats, templates, confirmation dialog on delete.
