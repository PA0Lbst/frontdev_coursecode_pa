import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WorkoutSetForm } from "./WorkoutSetForm";

test("Add is disabled and aria-disabled when fields are empty", async () => {
  const screen = await render(<WorkoutSetForm onAdd={vi.fn()} />);
  const add = screen.getByRole("button", { name: "Add" });
  await expect.element(add).toBeDisabled();
  await expect.element(add).toHaveAttribute("aria-disabled", "true");
});

test("submit with all fields calls onAdd with numeric reps and weight", async () => {
  const onAdd = vi.fn();
  const screen = await render(<WorkoutSetForm onAdd={onAdd} />);
  await screen.getByRole("combobox", { name: "Exercise" }).fill("Bench Press");
  await screen.getByRole("spinbutton", { name: "Reps" }).fill("8");
  await screen.getByRole("spinbutton", { name: "Weight (kg)" }).fill("60");
  await screen.getByRole("button", { name: "Add" }).click();
  expect(onAdd).toHaveBeenCalledWith({
    exercise: "Bench Press",
    reps: 8,
    weight: 60,
  });
});

test("Exercise field is wired to the known-exercise suggestion list", async () => {
  const screen = await render(<WorkoutSetForm onAdd={vi.fn()} />);
  const exerciseInput = screen.getByRole("combobox", { name: "Exercise" })
    .element() as HTMLInputElement;
  expect(exerciseInput.list?.id).toBe("workout-set-form-exercise-list");
  const optionValues = Array.from(exerciseInput.list?.options ?? []).map(
    (option) => option.value,
  );
  expect(optionValues).toContain("Russian twists");
});
