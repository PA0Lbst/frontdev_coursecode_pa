# Implementation Plan: Workout Tracking UI

Source spec: [spec.md](./spec.md)

Replace the todo UI (`TodoForm`/`TodoItem`/`TodoList`/`TodoPage`) with `WorkoutSetForm`/`WorkoutSetItem`/`WorkoutSetList`/`WorkoutPage`, wire `/` to the workout Server Actions with the current session resolved and hidden in `page.tsx`, rename the app title, and replace the todo e2e spec.

## Technical context

- Next.js 16 / React 19 / Tailwind 4, Vitest browser (`vitest-browser-react`) + Playwright, per `AGENTS.md`.
- Backend already implemented (`010-workout-backend`): `src/actions/workoutSession/{createSession,listSessions,deleteSession}` and `src/actions/workoutSet/{createSet,updateSet,deleteSet}`, `src/actions/workoutSet/helpers.ts`. Not touched by this plan.
- Row types from `@/generated/prisma/browser`:
  - `WorkoutSession = { id: number; createdAt: Date; name: string | null }`
  - `WorkoutSet = { id: number; sessionId: number; createdAt: Date; exercise: string; reps: number; weight: number }`
- `listSessions()` returns `(WorkoutSession & { sets: WorkoutSet[] })[]`, newest session first, each session's `sets` oldest-first.
- Reusable atoms unchanged: `Button`, `Input` (`type="number"` already supported via `ComponentProps<"input">`). `Textarea` is not used by the new components.
- `PageTemplate` / `Footer` unchanged.

## Target structure

```
src/components/
  molecules/
    WorkoutSetForm/WorkoutSetForm.tsx
    WorkoutSetForm/WorkoutSetForm.stories.tsx
    WorkoutSetForm/WorkoutSetForm.test.tsx
    WorkoutSetItem/WorkoutSetItem.tsx
    WorkoutSetItem/WorkoutSetItem.stories.tsx
    WorkoutSetItem/WorkoutSetItem.test.tsx
    TodoForm/           [deleted]
    TodoItem/           [deleted]
  organisms/
    WorkoutSetList/WorkoutSetList.tsx
    WorkoutSetList/WorkoutSetList.stories.tsx
    WorkoutSetList/WorkoutSetList.test.tsx
    TodoList/           [deleted]
    Header/Header.tsx           [modified: "Todoish" -> "Workoutish"]
    Header/Header.stories.tsx   [modified if it asserts the text]
    Header/Header.test.tsx      [modified if it asserts the text]
  pages/
    WorkoutPage/WorkoutPage.tsx
    WorkoutPage/WorkoutPage.stories.tsx
    WorkoutPage/WorkoutPage.test.tsx
    TodoPage/           [deleted]
src/app/page.tsx        [modified]
tests/e2e/workout.spec.ts  [new]
tests/e2e/todo.spec.ts     [deleted]
```

## `WorkoutSetForm`

`src/components/molecules/WorkoutSetForm/WorkoutSetForm.tsx`, `"use client"`.

```ts
export type WorkoutSetFormProps = {
  onAdd: (item: { exercise: string; reps: number; weight: number }) => void | Promise<void>;
};
```

- Local state: `exercise` (string, `""`), `reps` (string, `""`), `weight` (string, `""`), `adding` (boolean).
- Field ids: `workout-set-form-exercise`, `workout-set-form-reps`, `workout-set-form-weight`. Labels: "Exercise", "Reps", "Weight (kg)".
- `Input` for exercise (`type="text"`, default), `Input type="number"` for reps and weight. No `min`/`step` attributes.
- Validity check (used both for disabling Add and guarding submit), computed each render — do not extract to a shared helper file (mirrors `TodoForm`'s inline trim/empty check):
  ```ts
  const trimmedExercise = exercise.trim();
  const parsedReps = Number(reps);
  const parsedWeight = Number(weight);
  const isValid =
    trimmedExercise !== "" &&
    Number.isInteger(parsedReps) &&
    Number.isFinite(parsedWeight);
  ```
- `handleSubmit`: `preventDefault`, `if (!isValid) return;`, else `setAdding(true)`, `await onAdd({ exercise: trimmedExercise, reps: parsedReps, weight: parsedWeight })`, clear all three fields on success, `finally setAdding(false)`.
- Add button: `disabled={!isValid || adding}`.

## `WorkoutSetItem`

`src/components/molecules/WorkoutSetItem/WorkoutSetItem.tsx`, `"use client"`.

```ts
export type WorkoutSetItemProps = {
  set: WorkoutSet;
  onUpdate: (set: WorkoutSet) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
};
```

- Local state: `editing`, `exercise`, `reps`, `weight` (strings), `saving`, `deleting` — same shape as `TodoItem`.
- `enterEdit()`: seeds `exercise = set.exercise`, `reps = String(set.reps)`, `weight = String(set.weight)`, `editing = true`.
- Same `isValid` computation as `WorkoutSetForm` (duplicated inline, not shared).
- `handleSave()`: guard on `isValid`, else `setSaving(true)`, `await onUpdate({ ...set, exercise: trimmedExercise, reps: parsedReps, weight: parsedWeight })`, `setEditing(false)`, `finally setSaving(false)`.
- `handleDelete()`: same as `TodoItem` (`setDeleting(true)` / `onDelete(set.id)` / `finally`).
- Field ids in edit mode: `workout-set-item-exercise-${set.id}`, `workout-set-item-reps-${set.id}`, `workout-set-item-weight-${set.id}`.
- Read view: `<p>{set.exercise}</p>`, `<p>{set.reps} × {set.weight} kg</p>`, `<p>{set.createdAt.toLocaleDateString("en-US")}</p>`, Edit/Delete buttons (`size="sm"`, `variant="secondary"`) — same layout classes as `TodoItem`.
- Edit view: same three fields as `WorkoutSetForm` (Exercise / Reps / Weight (kg)), then Save (`disabled={!isValid || saving}`) and Cancel (`variant="secondary"`, never disabled).

## `WorkoutSetList`

`src/components/organisms/WorkoutSetList/WorkoutSetList.tsx`, `"use client"`.

```ts
export type WorkoutSetListProps = {
  sets: WorkoutSet[];
  onAdd: (item: { exercise: string; reps: number; weight: number }) => void | Promise<void>;
  onUpdate: (set: WorkoutSet) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
};
```

Same shape as `TodoList`: `<div className="flex min-w-80 flex-col gap-6">`, `WorkoutSetForm`, `{sets.length === 0 ? <p>No sets yet.</p> : null}`, `<ul>` of `<li key={set.id}><WorkoutSetItem set={set} onUpdate={onUpdate} onDelete={onDelete} /></li>`.

## `WorkoutPage`

`src/components/pages/WorkoutPage/WorkoutPage.tsx`, `"use client"`.

```ts
export type WorkoutPageProps = {
  initialSets?: WorkoutSet[];
  createSet: (input: { exercise: string; reps: number; weight: number }) => Promise<WorkoutSet>;
  updateSet: (input: { id: number; exercise: string; reps: number; weight: number }) => Promise<WorkoutSet>;
  deleteSet: (id: number) => Promise<void>;
};

function toClientSet(set: WorkoutSet): WorkoutSet {
  return { ...set, createdAt: new Date(set.createdAt) };
}
```

- `useState<WorkoutSet[]>(() => [...(initialSets ?? [])].reverse().map(toClientSet))` — reverse before mapping (order doesn't matter functionally, but keeps the "reverse the backend's oldest-first order" step visually first).
- `errorMessage` state, same pattern as `TodoPage`.
- `onAdd({ exercise, reps, weight })`: `try { const returned = await createSet({ exercise, reps, weight }); setSets((current) => [toClientSet(returned), ...current]); setErrorMessage(null); } catch { setErrorMessage("Something went wrong. Try again."); throw error; }`.
- `onUpdate(set)`: call `updateSet({ id: set.id, exercise: set.exercise, reps: set.reps, weight: set.weight })`, replace matching id on success, same error handling.
- `onDelete(id)`: call `deleteSet(id)`, filter out on success, same error handling.
- Render: `PageTemplate` > `<div className="mx-auto w-full max-w-2xl">` > error `<p role="alert">` (conditional) > `WorkoutSetList` — identical structure to `TodoPage`.

## `Header`

- Change the `<h1>` text `"Todoish"` → `"Workoutish"` in `Header.tsx`. No other change.
- Update any story/test asserting `"Todoish"` to `"Workoutish"`.

## `src/app/page.tsx`

```ts
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { listSessions } from "@/actions/workoutSession/listSessions/listSessions";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSet } from "@/actions/workoutSet/deleteSet/deleteSet";
import { updateSet } from "@/actions/workoutSet/updateSet/updateSet";

import { WorkoutPage } from "@/components/pages/WorkoutPage/WorkoutPage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessions = await listSessions();
  const currentSession = sessions[0] ?? (await createSession({}));
  const initialSets = sessions[0]?.sets ?? [];

  async function addSet(input: {
    exercise: string;
    reps: number;
    weight: number;
  }) {
    "use server";
    return createSet({ sessionId: currentSession.id, ...input });
  }

  return (
    <WorkoutPage
      initialSets={initialSets}
      createSet={addSet}
      updateSet={updateSet}
      deleteSet={deleteSet}
    />
  );
}
```

- `addSet` is a function-level `"use server"` closure defined inside `Home`, not a new file under `src/actions/`. It contains no logic beyond binding `sessionId`.
- `sessions[0]` (has `.sets`) and `await createSession({})` (no `.sets`) are a union only used for `.id`; `initialSets` is read from `sessions[0]?.sets` directly so no narrowing issue arises.

## Stories & tests

For each new component, mirror the matching Todo component's story/test file structure and depth exactly (CSF3 `Meta`/`StoryObj` from `@storybook/nextjs-vite`, `fn()` from `storybook/test`, `tags: ["autodocs"]`, `layout: "centered"` for molecules/organisms and `"fullscreen"` for `WorkoutPage`, `argTypes: { <fn props>: { table: { disable: true } } }`; tests via `vitest-browser-react` + `expect`/`vi` from `vitest`).

Sample fixture used across stories/tests:

```ts
const sampleSet = {
  id: 1,
  sessionId: 1,
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  exercise: "Bench Press",
  reps: 8,
  weight: 60,
};
const sampleSets = [
  sampleSet,
  {
    id: 2,
    sessionId: 1,
    createdAt: new Date("2026-01-16T00:00:00.000Z"),
    exercise: "Squat",
    reps: 5,
    weight: 100,
  },
];
```

- `WorkoutSetForm.stories.tsx` play: type "Bench Press" into "Exercise", "8" into "Reps", "60" into "Weight (kg)", click "Add".
- `WorkoutSetForm.test.tsx`: (1) Add disabled + `aria-disabled` when all fields empty; (2) filling exercise/reps/weight and submitting calls `onAdd` with `{ exercise, reps: 8, weight: 60 }` (numbers, not strings).
- `WorkoutSetItem.stories.tsx` play: click "Edit" (same as `TodoItem`).
- `WorkoutSetItem.test.tsx`: (1) read view shows exercise/reps/weight text; (2) clicking Edit then Save with changed values calls `onUpdate` with the merged set.
- `WorkoutSetList.stories.tsx` / `.test.tsx`: mirror `TodoList`'s (renders form + items; add calls `onAdd`).
- `WorkoutPage.stories.tsx` / `.test.tsx`: mirror `TodoPage`'s — mock `createSet`/`updateSet`/`deleteSet` with `fn()`/`vi.fn()` returning a `WorkoutSet`-shaped row; assert "No sets yet.", "Workoutish" heading, add-from-empty flow.
- `Header.stories.tsx` / `.test.tsx`: update any `"Todoish"` assertion to `"Workoutish"`.

## `tests/e2e/workout.spec.ts`

Replaces `tests/e2e/todo.spec.ts`, same shape with workout fields:

- Unique data: `` const exercise = `e2e-set-${Date.now()}` ``.
- `page.goto("/")`, assert heading `"Workoutish"`.
- Fill "Exercise" with `exercise`, "Reps" with `"5"`, "Weight (kg)" with `"20"`, click "Add"; assert a `listitem` containing `exercise` is visible.
- Reload, re-assert visible.
- Click that item's "Edit", fill "Exercise" with `` `${exercise}-edited` ``, click "Save"; assert the edited text visible.
- Reload, re-assert.
- Click "Delete" on the edited item; assert it's gone (`toHaveCount(0)`).
- Reload, re-assert gone.
- Uses `prisma/dev.db` (default e2e config); does not wipe the DB.

## Implementation order

1. Delete `TodoForm`, `TodoItem`, `TodoList`, `TodoPage` folders (component + stories + test each).
2. Add `WorkoutSetForm` (component, stories, test).
3. Add `WorkoutSetItem` (component, stories, test).
4. Add `WorkoutSetList` (component, stories, test).
5. Add `WorkoutPage` (component, stories, test).
6. Update `Header.tsx` and its story/test to "Workoutish".
7. Update `src/app/page.tsx` per the sketch above.
8. Replace `tests/e2e/todo.spec.ts` with `tests/e2e/workout.spec.ts`.
9. Run `npx tsc --noEmit`, `npm test` (Storybook + components + actions Vitest projects), `npm run test:e2e`.

## Out of scope

- `src/actions/workoutSession/*`, `src/actions/workoutSet/*`, `prisma/schema.prisma`, and their tests (owned by `010-workout-backend`) — no edits.
- Any session UI, `deleteSession`/`createSession` exposed to the client, session history or grouping.
- New Server Action files under `src/actions/` (only the inline bound closure in `page.tsx`).
- Auth, exercise catalog/autocomplete, charts/history, units other than kilograms.
- Route Handlers, `revalidatePath`, `router.refresh`, optimistic/fake rows.
- Dark mode, design tokens, new npm packages.
