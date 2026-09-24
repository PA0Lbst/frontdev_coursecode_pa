import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WorkoutPage } from "./WorkoutPage";

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

function mockActions() {
  return {
    createSet: vi.fn(
      async (input: { exercise: string; reps: number; weight: number }) => ({
        id: 100,
        sessionId: 1,
        createdAt: new Date("2026-01-17T00:00:00.000Z"),
        exercise: input.exercise,
        reps: input.reps,
        weight: input.weight,
      }),
    ),
    updateSet: vi.fn(
      async (input: {
        id: number;
        exercise: string;
        reps: number;
        weight: number;
      }) => ({
        id: input.id,
        sessionId: 1,
        createdAt: new Date("2026-01-15T00:00:00.000Z"),
        exercise: input.exercise,
        reps: input.reps,
        weight: input.weight,
      }),
    ),
    deleteSet: vi.fn(async () => {}),
  };
}

test("empty initialSets shows empty message, Add, and Gymtiiime heading", async () => {
  const screen = await render(<WorkoutPage title="Push day" {...mockActions()} />);
  await expect.element(screen.getByText("No sets yet.")).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Add" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("heading", { name: "Gymtiiime" }))
    .toBeVisible();
});

test("non-empty initialSets shows those exercises", async () => {
  const screen = await render(
    <WorkoutPage title="Push day" initialSets={sampleSets} {...mockActions()} />,
  );
  await expect.element(screen.getByText("Bench Press")).toBeVisible();
  await expect.element(screen.getByText("Squat")).toBeVisible();
});

test("add from empty makes the new exercise visible and removes the empty message", async () => {
  const screen = await render(<WorkoutPage title="Push day" {...mockActions()} />);
  await screen.getByRole("combobox", { name: "Exercise" }).fill("Deadlift");
  await screen.getByRole("spinbutton", { name: "Reps" }).fill("3");
  await screen.getByRole("spinbutton", { name: "Weight (kg)" }).fill("120");
  await screen.getByRole("button", { name: "Add" }).click();
  await expect.element(screen.getByText("Deadlift")).toBeVisible();
  await expect.element(screen.getByText("No sets yet.")).not.toBeInTheDocument();
});

test("shows the workout title and a link back to the workout list", async () => {
  const screen = await render(
    <WorkoutPage title="Push day" {...mockActions()} />,
  );
  await expect
    .element(screen.getByRole("heading", { name: "Push day" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("link", { name: "Back to workouts" }))
    .toHaveAttribute("href", "/");
});
