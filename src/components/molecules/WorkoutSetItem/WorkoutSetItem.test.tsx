import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WorkoutSetItem } from "./WorkoutSetItem";

const sampleSet = {
  id: 1,
  sessionId: 1,
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  exercise: "Bench Press",
  reps: 8,
  weight: 60,
};

test("read view shows exercise, reps, and weight", async () => {
  const screen = await render(
    <WorkoutSetItem set={sampleSet} onUpdate={vi.fn()} onDelete={vi.fn()} />,
  );
  await expect.element(screen.getByText("Bench Press")).toBeVisible();
  await expect.element(screen.getByText("8 × 60 kg")).toBeVisible();
});

test("edit then save with changed values calls onUpdate with the merged set", async () => {
  const onUpdate = vi.fn();
  const screen = await render(
    <WorkoutSetItem set={sampleSet} onUpdate={onUpdate} onDelete={vi.fn()} />,
  );
  await screen.getByRole("button", { name: "Edit" }).click();
  await screen.getByRole("spinbutton", { name: "Reps" }).fill("10");
  await screen.getByRole("spinbutton", { name: "Weight (kg)" }).fill("65");
  await screen.getByRole("button", { name: "Save" }).click();
  expect(onUpdate).toHaveBeenCalledWith({
    ...sampleSet,
    exercise: "Bench Press",
    reps: 10,
    weight: 65,
  });
});

test("edit-mode Exercise field is wired to the known-exercise suggestion list", async () => {
  const screen = await render(
    <WorkoutSetItem set={sampleSet} onUpdate={vi.fn()} onDelete={vi.fn()} />,
  );
  await screen.getByRole("button", { name: "Edit" }).click();
  const exerciseInput = screen.getByRole("combobox", { name: "Exercise" })
    .element() as HTMLInputElement;
  expect(exerciseInput.list?.id).toBe(
    `workout-set-item-exercise-list-${sampleSet.id}`,
  );
  const optionValues = Array.from(exerciseInput.list?.options ?? []).map(
    (option) => option.value,
  );
  expect(optionValues).toContain("Russian twists");
});

test("readOnly shows the set without Edit or Delete", async () => {
  const screen = await render(<WorkoutSetItem set={sampleSet} readOnly />);
  await expect.element(screen.getByText("Bench Press")).toBeVisible();
  await expect.element(screen.getByText("8 × 60 kg")).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Edit" }))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Delete" }))
    .not.toBeInTheDocument();
});
