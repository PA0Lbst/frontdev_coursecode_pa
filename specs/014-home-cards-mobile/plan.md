# Implementation Plan: Home Cards & Mobile-Friendly Create

Source spec: [spec.md](./spec.md)

Adds a `WorkoutCard` molecule, reworks the create form and list layout in `WorkoutListPage`, and changes the unnamed-workout label to `Untitled workout`. No schema change, no new action, no npm package.

## Technical context

- `WorkoutListPage` (client) already holds sessions state, create/delete handlers, and error alert; only markup and the state element type change.
- `Input` and `Button` accept `className` (appended last). Only their class maps change (styling, see below); no prop/API changes. Do not modify `PageTemplate` (`main` keeps `px-6 py-8`).
- `Button` has no danger variant; the card's Delete is a custom red menu item (native `<button role="menuitem">`), not the `Button` atom.
- `workoutLabel` is used by `WorkoutListPage` and `src/app/workouts/[id]/page.tsx`.
- Only test asserting old label text: `WorkoutListPage.test.tsx` line ~36 (`Workout of 15/01/2026`). Check `tests/e2e/workout.spec.ts` for the `Add` button name.
- The card link's accessible name will include label, date, and count. Queries on it must use a regex or partial name (e.g. `{ name: /Leg day/ }`); Storybook `canvas.getByRole` string names are exact. Vitest browser locators match substrings by default.

## Target structure

```
src/data/workoutLabel.ts                                          [modified]
src/components/atoms/Button/Button.tsx                            [modified]
src/components/atoms/Input/Input.tsx                              [modified]
src/components/molecules/WorkoutCard/WorkoutCard.tsx              [new]
src/components/molecules/WorkoutCard/WorkoutCard.stories.tsx      [new]
src/components/molecules/WorkoutCard/WorkoutCard.test.tsx         [new]
src/components/pages/WorkoutListPage/WorkoutListPage.tsx          [modified]
src/components/pages/WorkoutListPage/WorkoutListPage.stories.tsx  [modified]
src/components/pages/WorkoutListPage/WorkoutListPage.test.tsx     [modified]
src/app/page.tsx                                                  [modified]
tests/e2e/workout.spec.ts                                         [modified]
```

## `src/data/workoutLabel.ts`

```ts
export function formatWorkoutDate(date: Date) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

export function workoutLabel(session: { name: string | null; createdAt: Date }) {
  return session.name ? session.name : "Untitled workout";
}
```

`createdAt` stays in the signature (callers unchanged).

## `Button` / `Input` styling

- `Button` `baseClasses`: add `rounded-full transition-colors active:scale-[0.98]`. `variantClasses.primary`: add `shadow-sm`. Keep `relative`.
- `Input` `baseClasses`: add `rounded-lg transition-colors hover:border-zinc-400 focus-visible:border-black`.
- No story/test changes expected; existing Button/Input tests and stories must pass.

## `WorkoutCard`

- `"use client"` (Delete `onClick`). Named + default export.
- Props: `id: number`, `label: string`, `date: Date`, `exerciseCount: number`, `onDelete: () => void | Promise<void>`, `deleting?: boolean`.
- State: `open` boolean. `useRef` on the wrapper; `useEffect` while open adds `document` `mousedown` (close if outside wrapper) and `keydown` (`Escape` closes, focus returns to trigger).
- Markup:

```tsx
<article className="relative rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
  <Link href={`/workouts/${id}`} className="block rounded-xl p-4 pr-16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
    <h3 className="truncate text-lg font-semibold">{label}</h3>
    <p className="text-sm text-zinc-500">{formatWorkoutDate(date)}</p>
    <p className="text-sm text-zinc-500">{count}</p>
  </Link>
  <div ref={ref} className="absolute right-2 top-2">
    <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl leading-none text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>⋯</button>
    {open ? (
      <div role="menu" className="absolute right-0 top-12 z-10 min-w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-md">
        <button type="button" role="menuitem" disabled={deleting} onClick={handleDelete}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-red-600 hover:bg-red-50 disabled:opacity-50">
          {/* inline 16px trash <svg aria-hidden stroke="currentColor"> */}Delete
        </button>
      </div>
    ) : null}
  </div>
</article>
```

- `handleDelete`: `setOpen(false)` then `await onDelete()`.
- The `⋯` trigger does not import `Button`. Trash icon is an inline SVG (no icon package), `stroke="currentColor"` so it is red.
- Count text: `` `${n} exercise${n === 1 ? "" : "s"}` ``.
- `pr-16` keeps the title clear of the absolute Delete button. Verify no overlap at 320px.
- Stories: `Molecules/WorkoutCard`, `layout: "centered"`, `tags: ["autodocs"]`, `controls.include: ["label", "date", "exerciseCount", "deleting"]`, hide `id`/`onDelete` via `argTypes` table disable, one `Default` with `play` (click `Actions for Push day` → click `Delete` menuitem → spy called). Import `./WorkoutCard`.

## `WorkoutListPage`

- Export `type WorkoutSessionSummary = WorkoutSession & { setCount: number }`; `initialSessions?: WorkoutSessionSummary[]`; state holds summaries. `toClientSession` takes a `WorkoutSession` and returns with `createdAt` coerced; initial map keeps `setCount`; create result becomes `{ ...toClientSession(returned), setCount: 0 }`.
- Form: `className="flex flex-col gap-3 sm:flex-row sm:items-end"`; label + Input in a `flex flex-1 flex-col gap-1` wrapper. Input: `placeholder="Workout name (optional)"`, `autoComplete="off"`, `enterKeyHint="done"`, `className="min-h-11 text-base"`. Button: `Add workout`, `type="submit"`, `size="lg"`, `className="min-h-11 w-full sm:w-auto"` (no `fullWidth` prop, so `sm:w-auto` wins).
- Label text stays `Name` (input accessible name unchanged, placeholder is extra).
- List: `<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">`; each `<li>` renders `WorkoutCard` with `label={workoutLabel(session)}`, `date={session.createdAt}`, `exerciseCount={session.setCount}`, `deleting={deletingId === session.id}`, `onDelete={() => handleDelete(session.id)}`.
- Container stays `mx-auto flex w-full max-w-2xl flex-col gap-6`. Empty state unchanged.

## `src/app/page.tsx`

```tsx
const rows = sessions.map(({ sets, ...session }) => ({ ...session, setCount: sets.length }));
```

Remove the `void sets` workaround.

## Tests

- `WorkoutCard.test.tsx`: link `href="/workouts/<id>"`, label + `15/01/2026` date text, `0 exercises` / `1 exercise` / `3 exercises`, opening the menu shows `Delete`; choosing it calls the spy and closes the menu; `Escape` closes; `deleting` disables the item. Sync spies only.
- `WorkoutListPage.test.tsx`: add `setCount` to sample data; button name `Add workout`; unnamed workout link matches `/Untitled workout/` (replace `Workout of 15/01/2026`); links use regex names; new workout shows `0 exercises`; existing create/delete/error cases still pass.
- `WorkoutListPage.stories.tsx`: add `setCount` to samples; `Default` play clicks `Add workout` and asserts `canvas.getByRole("link", { name: /Leg day/ })`.
- E2E (`workout.spec.ts`): rename button to `Add workout`; link locators use partial/regex names; add a test with `test.use({ viewport: { width: 375, height: 667 } })`: create unique-named workout → tap its card → detail title visible → `Back to workouts` → open `Actions for <name>` → `Delete` → gone. Unique names, no DB wipe.

## Implementation order

1. `workoutLabel.ts` (`formatWorkoutDate`, `Untitled workout`).
1a. `Button` and `Input` class-map styling.
2. `WorkoutCard` (component, story, test).
3. `WorkoutListPage` rework, story, test.
4. `page.tsx` mapping.
5. E2E.

## Out of scope

- Everything in the spec's out-of-scope section (no new Button variants/sizes).
- Edits to `src/generated/prisma`, Route Handlers, `revalidatePath`/`router.refresh`, the 013 spec files.
