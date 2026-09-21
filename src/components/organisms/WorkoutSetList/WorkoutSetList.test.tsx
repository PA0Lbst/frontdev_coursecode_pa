import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WorkoutSetList } from "./WorkoutSetList";

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

test("empty list shows No sets yet and the form", async () => {
  const screen = await render(
    <WorkoutSetList
      sets={[]}
      onAdd={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  await expect.element(screen.getByText("No sets yet.")).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Add" }))
    .toBeVisible();
});

test("non-empty list shows exercises and not the empty message", async () => {
  const screen = await render(
    <WorkoutSetList
      sets={sampleSets}
      onAdd={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
  await expect.element(screen.getByText("Bench Press")).toBeVisible();
  await expect.element(screen.getByText("Squat")).toBeVisible();
  await expect.element(screen.getByText("No sets yet.")).not.toBeInTheDocument();
});

test("readOnly shows sets with no form, Edit or Delete", async () => {
  const screen = await render(<WorkoutSetList sets={sampleSets} readOnly />);
  await expect.element(screen.getByText("Squat")).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Add" }))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Edit" }))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Delete" }))
    .not.toBeInTheDocument();
});
