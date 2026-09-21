# Implementation Plan: Exercise Name Suggestions

Source spec: [spec.md](./spec.md)

Add a static exercise-name catalog and wire it into the Exercise field's `list` attribute (native `<datalist>`) in `WorkoutSetForm` and `WorkoutSetItem`'s edit mode. No new npm package, no backend change.

## Technical context

- Next.js 16 / React 19, Vitest browser (`vitest-browser-react`) per `AGENTS.md`. No `Input.tsx` change: `list` already passes through via `ComponentProps<"input">`.
- Existing files touched: `src/components/molecules/WorkoutSetForm/WorkoutSetForm.{tsx,test.tsx}`, `src/components/molecules/WorkoutSetItem/WorkoutSetItem.{tsx,test.tsx}`.
- Test mechanism: `vitest-browser-react` locators don't expose a role query for `<datalist>`/`<option>`. Use the native DOM: `(exerciseLocator.element() as HTMLInputElement).list` returns the associated `HTMLDataListElement` (or `null`); read `.id` and `.options` off it.

## Target structure

```
src/data/exerciseCatalog.ts                                    [new]
src/components/molecules/WorkoutSetForm/WorkoutSetForm.tsx     [modified]
src/components/molecules/WorkoutSetForm/WorkoutSetForm.test.tsx [modified]
src/components/molecules/WorkoutSetItem/WorkoutSetItem.tsx     [modified]
src/components/molecules/WorkoutSetItem/WorkoutSetItem.test.tsx [modified]
```

## `src/data/exerciseCatalog.ts`

```ts
export const EXERCISE_CATALOG: readonly string[] = [
  "Arnold press",
  "Barbell back squat",
  "Barbell bench press",
  "Barbell deadlift",
  "Bent-over row",
  "Bicep curl",
  "Bulgarian split squat",
  "Cable tricep pushdown",
  "Diverging lat pulldown",
  "Dumbbell shoulder press",
  "Face pull",
  "Hip thrust",
  "Incline dumbbell press",
  "Lat pulldown",
  "Leg press",
  "Lunges",
  "Overhead press",
  "Plank",
  "Pull-up",
  "Push-up",
  "Romanian deadlift",
  "Russian twists",
  "Seated cable row",
  "Walking lunge",
];
```

## `WorkoutSetForm`

- Import: `import { EXERCISE_CATALOG } from "@/data/exerciseCatalog";`.
- Immediately after the Exercise `Input`, add:
  ```tsx
  <datalist id="workout-set-form-exercise-list">
    {EXERCISE_CATALOG.map((name) => (
      <option key={name} value={name} />
    ))}
  </datalist>
  ```
- Add `list="workout-set-form-exercise-list"` to the Exercise `Input`. No other change to that component.

## `WorkoutSetItem`

- Import: `import { EXERCISE_CATALOG } from "@/data/exerciseCatalog";`.
- In the edit-mode branch, immediately after the Exercise `Input`, add:
  ```tsx
  <datalist id={`workout-set-item-exercise-list-${set.id}`}>
    {EXERCISE_CATALOG.map((name) => (
      <option key={name} value={name} />
    ))}
  </datalist>
  ```
- Add `list={`workout-set-item-exercise-list-${set.id}`}` to the edit-mode Exercise `Input`. Read view is unaffected.

## Tests

`WorkoutSetForm.test.tsx` — add:

```ts
test("Exercise field is wired to the known-exercise suggestion list", async () => {
  const screen = await render(<WorkoutSetForm onAdd={vi.fn()} />);
  const exerciseInput = screen.getByRole("textbox", { name: "Exercise" })
    .element() as HTMLInputElement;
  expect(exerciseInput.list?.id).toBe("workout-set-form-exercise-list");
  const optionValues = Array.from(exerciseInput.list?.options ?? []).map(
    (option) => option.value,
  );
  expect(optionValues).toContain("Russian twists");
});
```

`WorkoutSetItem.test.tsx` — add (enter edit mode first, since the edit-mode field doesn't exist in the read view):

```ts
test("edit-mode Exercise field is wired to the known-exercise suggestion list", async () => {
  const screen = await render(
    <WorkoutSetItem set={sampleSet} onUpdate={vi.fn()} onDelete={vi.fn()} />,
  );
  await screen.getByRole("button", { name: "Edit" }).click();
  const exerciseInput = screen.getByRole("textbox", { name: "Exercise" })
    .element() as HTMLInputElement;
  expect(exerciseInput.list?.id).toBe(
    `workout-set-item-exercise-list-${sampleSet.id}`,
  );
  const optionValues = Array.from(exerciseInput.list?.options ?? []).map(
    (option) => option.value,
  );
  expect(optionValues).toContain("Russian twists");
});
```

## Implementation order

1. Add `src/data/exerciseCatalog.ts`.
2. Update `WorkoutSetForm.tsx` (import, `<datalist>`, `list` attribute).
3. Add the suggestion-wiring test to `WorkoutSetForm.test.tsx`.
4. Update `WorkoutSetItem.tsx` (import, row-scoped `<datalist>`, `list` attribute in edit mode).
5. Add the suggestion-wiring test to `WorkoutSetItem.test.tsx`.
6. Run `npx tsc --noEmit` and `npm test`.

## Out of scope

- Custom/editable catalogs, per-user or "recently used" history, promoting typed values into the list.
- Fuzzy matching, ranking, or a custom dropdown component — native `<datalist>` filtering only.
- Validating a submitted exercise name against the catalog.
- Server-side storage or a Prisma model for the catalog.
- Any change to `Input.tsx`, stories, `src/actions/*`, `prisma/schema.prisma`, or new npm packages.
