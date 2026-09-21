# Home Cards & Mobile-Friendly Create

## Context

- `/` renders `WorkoutListPage` (spec 013): a plain form (label + `Input` + `Add`) on top of a `<ul>` where each row is an underlined link plus a small `Delete` button.
- `listSessions` already returns each session with its `sets`, so an exercise count is available without a new action.
- `Button` has `sm | md | lg` sizes and `fullWidth`; `Input` is a plain atom.

## Goals

Make the home page feel like a phone app: each workout is a tappable card, and creating a workout is quick and comfortable with a thumb.

## Requirements

### Workout cards

- New molecule `WorkoutCard` (presentational, no actions/Prisma): props `id`, `label`, `date` (`Date`), `exerciseCount`, `onDelete`, `deleting?`.
- The whole card body links to `/workouts/[id]` (one `next/link`, so the full area is tappable; no nested interactive elements inside the link).
- Card shows: workout label (title), the date always shown separately (UTC `DD/MM/YYYY`), and `N exercise(s)` (`1 exercise`, `0 exercises`).
- Top-right of the card, outside the link, a round, borderless, background-less `⋯` menu button (no gray fill at rest; light hover fill only) (`aria-label="Actions for <label>"`, `aria-haspopup="menu"`, `aria-expanded`), minimum 44×44px. It opens a small menu with one item: a red trash icon + `Delete` (`role="menuitem"`, min 44px tall). Choosing it deletes immediately (no confirmation) and closes the menu; disabled while `deleting`.
- The menu closes on outside click, `Escape`, or item choice. Plain React state in the card; no new packages.
- Visual: rounded border, padding, hover raises shadow, `focus-visible` outline on the link, readable on 320px width. Plain Tailwind, no new packages.

### Workout label change

- `workoutLabel` returns `name`, or `Untitled workout` when name is null (replaces `Workout of DD/MM/YYYY`). Applies to list, cards, and the `/workouts/[id]` title. Export `formatWorkoutDate(date)` from `src/data/workoutLabel.ts` for the date line.
- Update existing tests/e2e/specs text that expect `Workout of DD/MM/YYYY`.
- List layout: single column on phones, two columns from `sm` up.

### Softer button and input styling

- Styling-only change to the `Button` and `Input` atoms (same props/API), applied app-wide for a consistent look:
  - `Button`: pill shape (`rounded-full`), `transition-colors`, `active:scale-[0.98]` press feedback, `shadow-sm` on `primary`; `secondary` keeps its border with a soft hover.
  - `Input`: `rounded-lg`, `transition-colors`, hover/focus border darkens (`focus-visible` outline kept).
- Cards use `rounded-xl`; the `⋯` trigger is a plain native button (not the `Button` atom), so it has no border or fill. `Input` stays `rounded-lg`.
- Existing `Button`/`Input` tests and stories must still pass unchanged.

### Mobile-friendly create

- Create form stays inline at the top of the page (no sticky bar, no sheet), compact: full-width `Input` with placeholder `Workout name (optional)` and a visible label, full-width `Add workout` button on phones (inline next to the input from `sm` up).
- Sizing achieved with `className` overrides from the page; do not change `Input`/`Button`/`PageTemplate` props or `PageTemplate` padding. Input and button are at least 44px tall; input font size ≥ 16px (prevents iOS zoom on focus); `autoComplete="off"`, `enterKeyHint="done"`.
- Submitting with Enter works; empty name still allowed; input clears only on success (unchanged behavior).
- No horizontal scroll at 320px width.

### Behavior (unchanged)

- Prepend on create, remove on delete, `createdAt` coercion, generic `role="alert"` error, native `disabled` while pending, no refetch (per AGENTS.md).
- Empty state: `No workouts yet.` stays.

### Data

- `page.tsx` passes `initialSessions` as rows plus `setCount` (from `sets.length`); newly created sessions have `setCount: 0`. The count is accurate at page load only (re-read on each visit to `/`). Introduce a local type `WorkoutSessionSummary = WorkoutSession & { setCount: number }` exported from `WorkoutListPage.tsx`. `createSession` prop keeps returning `WorkoutSession`.

### Tests

- `WorkoutCard`: component test + `Default` story (link `href`, label, date, count singular/plural, opening the menu and choosing Delete calls `onDelete`, menu closes on Escape, disabled while `deleting`).
- Update `WorkoutListPage` tests/story for cards, count, and `Add workout` button name.
- Update `tests/e2e/workout.spec.ts` for the renamed button; add a mobile-viewport (375×667) check that creating, opening (click on card), and deleting a workout works.

## Out of scope

- Exercise-name previews on cards; edits to the 013 spec text (014 supersedes its label rule).
- Changing `Button`/`Input` props or behavior, changing `PageTemplate`, new variants/sizes, sticky/floating create UI, renaming, reordering, search/filter, swipe-to-delete, delete confirmation, other menu items, stats beyond exercise count, dark mode, schema changes, new npm packages.
