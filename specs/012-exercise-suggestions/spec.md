# Exercise Name Suggestions

## Context

- Exercise field (`WorkoutSetForm`, `WorkoutSetItem` edit mode) is a plain `Input`. `011-workout-ui` left "exercise catalog/autocomplete" out of scope — this spec covers it.
- No DB, no Server Action, no npm package: static hardcoded list, native `<datalist>`.

## Goals

- Typing in the Exercise field suggests matches from a fixed list (e.g. "Diverging lat pulldown", "Russian twists"). Free text always still allowed.

## Requirements

### Data

- New `src/data/exerciseCatalog.ts` (new top-level folder for static app data, alongside `components`/`actions`; no `"use client"`, no Prisma, no Server Action).
- `export const EXERCISE_CATALOG: readonly string[]` — a curated static list of ~15-25 common strength-exercise names, including `"Diverging lat pulldown"` and `"Russian twists"`. Exact contents/count are not spec-pinned; keep the array sorted and de-duplicated by hand.

### Wiring

- `WorkoutSetForm`: render `<datalist id="workout-set-form-exercise-list">` with `<option value={name} />` per `EXERCISE_CATALOG` entry, next to the Exercise field; set `list="workout-set-form-exercise-list"` on that `Input`.
- `WorkoutSetItem` (edit mode): same pattern, but the id must be unique per row (multiple items render at once): `` `workout-set-item-exercise-list-${set.id}` ``, matching this component's existing `${set.id}`-suffixed id convention.
- No change to `value`/`onChange`, validation, or submit behavior — the `<datalist>` only suggests; free text stays fully allowed and unvalidated against the catalog.
- No `Input.tsx` change needed (`list` already passes through via `ComponentProps<"input">`).
- No story changes required — this doesn't add a new prop or change the documented API/controls.

### Tests

- `WorkoutSetForm.test.tsx`: assert the Exercise `Input` has `list="workout-set-form-exercise-list"` and a sibling `<datalist>` with that id contains an `<option>` for at least one known catalog entry (e.g. `"Russian twists"`).
- `WorkoutSetItem.test.tsx`: same assertion for the edit-mode Exercise field, using its row-scoped datalist id.
- Do not assert full catalog contents or ordering.

## Out of scope

- Custom/editable catalogs, per-user or "recently used" exercise history, promoting typed values into the list.
- Fuzzy matching, ranking, or a custom dropdown component — behavior is whatever the browser's native `<datalist>` filtering does; no acceptance criteria on matching behavior.
- Validating a submitted exercise name against the catalog (free text always allowed).
- Server-side storage or a Prisma model for the catalog.
