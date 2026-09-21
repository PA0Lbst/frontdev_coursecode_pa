# Tasks: Exercise Name Suggestions

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Do not add npm packages. Do not touch `src/actions/*` or `prisma/schema.prisma`, and do not add Server Actions or Route Handlers. Do not modify `Input.tsx`. Stories may only be edited to query the Exercise field as `combobox` (an `<input list>` has that role, not `textbox`).

## 1. Catalog data

- [x] Create `src/data/exerciseCatalog.ts` exporting `EXERCISE_CATALOG: readonly string[]` — alphabetically sorted, deduplicated, including `"Diverging lat pulldown"` and `"Russian twists"`.

## 2. `WorkoutSetForm`

- [x] Import `EXERCISE_CATALOG` from `@/data/exerciseCatalog`.
- [x] Render `<datalist id="workout-set-form-exercise-list">` with one `<option value={name} />` per catalog entry, right after the Exercise `Input`.
- [x] Add `list="workout-set-form-exercise-list"` to the Exercise `Input`. No other prop/behavior change.

## 3. `WorkoutSetItem`

- [x] Import `EXERCISE_CATALOG` from `@/data/exerciseCatalog`.
- [x] In edit mode, render `<datalist id={`workout-set-item-exercise-list-${set.id}`}>` with the same `<option>` mapping, right after the edit-mode Exercise `Input`.
- [x] Add the matching `list=` attribute to that Exercise `Input`. Read view is unaffected.

## 4. Tests

- [x] `WorkoutSetForm.test.tsx`: new test asserting the Exercise input's associated `<datalist>` (via `input.list`) has id `workout-set-form-exercise-list` and its `options` include `"Russian twists"`.
- [x] `WorkoutSetItem.test.tsx`: new test that clicks "Edit" first, then asserts the Exercise input's associated `<datalist>` has id `` `workout-set-item-exercise-list-${set.id}` `` and its `options` include `"Russian twists"`.

## Verify

- [x] `npx tsc --noEmit` passes.
- [x] `npm test` passes (storybook, components, and actions Vitest projects).
- [x] Manually load `/`, focus the Exercise field, confirm the browser offers catalog suggestions, and confirm a name not in the catalog is still accepted on submit.
