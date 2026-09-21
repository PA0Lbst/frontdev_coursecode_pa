# Implementation Plan: Workout Detail

Source spec: [spec.md](./spec.md)

`/` becomes a workout list (create + delete); the current `WorkoutPage` moves to `/workouts/[id]` and shows one workout's sets. Adds `getSession`, `workoutLabel`, and `WorkoutListPage`. No schema change, no new npm package.

## Technical context

- Reused unchanged: `createSession`, `listSessions`, `deleteSession`, `createSet` (already throws `"Session not found"`), `updateSet`, `deleteSet`.
- `listSessions` includes `sets`; `WorkoutListPage` only needs rows, so `page.tsx` maps them to plain `WorkoutSession` rows before passing (no sets serialized).
- Current `src/app/page.tsx` binds `createSet` to the latest session via `addSet`; that pattern moves to `/workouts/[id]`.
- `PageTemplate` already renders `Header` (`h1` "Workoutish") and `Footer`; both pages reuse it.
- Next 16 dynamic route `params` is a `Promise`: `{ params }: { params: Promise<{ id: string }> }`, `await params`. Read `node_modules/next/dist/docs/` for `notFound` / dynamic routes before writing.

## Target structure

```
src/data/workoutLabel.ts                                              [new]
src/actions/workoutSession/getSession/getSession.ts                   [new]
src/components/pages/WorkoutListPage/WorkoutListPage.tsx              [new]
src/components/pages/WorkoutListPage/WorkoutListPage.stories.tsx      [new]
src/components/pages/WorkoutListPage/WorkoutListPage.test.tsx         [new]
src/components/pages/WorkoutPage/WorkoutPage.tsx                      [modified]
src/components/pages/WorkoutPage/WorkoutPage.stories.tsx              [modified]
src/components/pages/WorkoutPage/WorkoutPage.test.tsx                 [modified]
src/app/page.tsx                                                      [modified]
src/app/workouts/[id]/page.tsx                                        [new]
tests/actions/workoutSession/getSession/getSession.test.ts            [new]
tests/e2e/workout.spec.ts                                             [modified]
```

## `src/data/workoutLabel.ts`

- No `"use client"`, no Prisma import; pure function, named + default export not required (data file, like `exerciseCatalog.ts`).

```ts
export function workoutLabel(session: { name: string | null; createdAt: Date }) {
  if (session.name) return session.name;
  const d = new Date(session.createdAt);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `Workout of ${dd}/${mm}/${d.getUTCFullYear()}`; // UTC: same on server and client
}
```

## `getSession`

```ts
"use server";
import { prisma } from "@/prisma/prismaClient";

export async function getSession(id: number) {
  return prisma.workoutSession.findUnique({
    where: { id },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
```

## `WorkoutListPage` (client)

- Props: `initialSessions?: WorkoutSession[]`, `createSession: (input: { name?: string | null }) => Promise<void>` (the injected action redirects to the new workout; no local prepend), `deleteSession: (id: number) => Promise<void>`.
- State: sessions (`toClientSession` coerces `createdAt` to `Date`, initial data already newest-first), `errorMessage`.
- Create form (inline in the page, no new molecule): label "Name" + `Input`, `Add` button (`variant="primary"`), native `disabled` while pending; clear input only on success. Empty name allowed. Prepend result on success.
- List: `<ul>` of `<li>`; each has `<Link href={`/workouts/${id}`}>{workoutLabel(session)}</Link>` (`next/link`) and a `Delete` button (`variant="danger"` if Button has it, else default variant; check `Button.tsx`), disabled while its own delete is pending. Remove on success.
- Empty list: `<p>No workouts yet.</p>`.
- Errors: generic `role="alert"` `Something went wrong. Try again.`, rethrow, cleared on next success.
- Wrapped in `PageTemplate`, `mx-auto w-full max-w-2xl` like `WorkoutPage`.

## `WorkoutPage` changes

- Add required prop `title: string`; render `<h2>{title}</h2>` and `<Link href="/">Back to workouts</Link>` above the list, inside the existing container. Other props/behavior unchanged.
- Existing test asserting the `Workoutish` heading stays valid (Header `h1`).

## Routes

`src/app/page.tsx`:

```tsx
export const dynamic = "force-dynamic";
export default async function Home() {
  const sessions = await listSessions();
  const rows = sessions.map(({ sets, ...session }) => session);
  async function createAndOpenSession(input: { name?: string | null }) {
    "use server";
    const session = await createSession(input);
    redirect(`/workouts/${session.id}`);
  }
  return <WorkoutListPage initialSessions={rows} createSession={createAndOpenSession} deleteSession={deleteSession} />;
}
```

`src/app/workouts/[id]/page.tsx`:

- `force-dynamic`. `const { id } = await params; const sessionId = Number(id);` if `!Number.isInteger(sessionId)` or `getSession` returns `null` → `notFound()` (`next/navigation`).
- Inline `"use server"` `addSet` closing over `sessionId`, calling `createSet` (same as today's pattern).
- Render `<WorkoutPage title={workoutLabel(session)} initialSets={session.sets} createSet={addSet} updateSet={updateSet} deleteSet={deleteSet} />`.

## Tests

- `getSession.test.ts` (node, `prisma/test.db`): create session + a set → returns session with `sets`; unknown id → `null`.
- `WorkoutListPage.test.tsx`: `vi.fn()` action props only. Cases: empty message; renders labels + links with correct `href` (named and unnamed → `Workout of DD/MM/YYYY`); create calls `createSession` and clears input; delete removes item; failing create/delete shows alert and leaves list unchanged.
- `WorkoutListPage.stories.tsx`: `Pages/WorkoutListPage`, `layout: "fullscreen"`, `tags: ["autodocs"]`, `parameters.controls.include: []` with action/data props hidden via `argTypes` table disable (same as `WorkoutPage` story), one `Default` story with a `play` that creates a workout and asserts it appears.
- `WorkoutPage` test + story: pass `title`; assert title heading and back link (`href="/"`).
- E2E (`workout.spec.ts`): unique workout name → create on `/` → click its link → assert URL `/workouts/\d+` and title → add exercise (existing steps: add, reload, edit, delete) → click `Back to workouts` → delete the workout → assert gone (also after reload). Replace `page.goto("/")` reloads inside the set flow with `page.reload()`.

## Implementation order

1. `workoutLabel.ts`, `getSession` + its test.
2. `WorkoutPage` `title` + back link (component, story, test).
3. `/workouts/[id]/page.tsx`.
4. `WorkoutListPage` (component, story, test).
5. `src/app/page.tsx` rewrite.
6. E2E update.

## Out of scope

- Renaming a workout, reordering, stats, templates, delete confirmation.
- Schema/`src/generated/prisma` edits, Route Handlers, `revalidatePath`/`router.refresh`, new npm packages.
