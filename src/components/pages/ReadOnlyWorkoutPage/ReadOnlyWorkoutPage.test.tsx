import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ReadOnlyWorkoutPage } from "./ReadOnlyWorkoutPage";

const sets = [
  { id: 1, sessionId: 4, createdAt: new Date("2026-01-15T00:00:00.000Z"), exercise: "Bench Press", reps: 8, weight: 60 },
  { id: 2, sessionId: 4, createdAt: new Date("2026-01-16T00:00:00.000Z"), exercise: "Squat", reps: 5, weight: 100 },
];

test("shows title, sets and a back link", async () => {
  const screen = await render(
    <ReadOnlyWorkoutPage title="Push day" sets={sets} backHref="/friends/bob" backLabel="Back to bob" />,
  );
  await expect.element(screen.getByRole("heading", { name: "Push day" })).toBeVisible();
  await expect.element(screen.getByText("Bench Press")).toBeVisible();
  await expect.element(screen.getByText("Squat")).toBeVisible();
  await expect
    .element(screen.getByRole("link", { name: "Back to bob" }))
    .toHaveAttribute("href", "/friends/bob");
});

test("has no edit, delete or add controls", async () => {
  const screen = await render(
    <ReadOnlyWorkoutPage title="Push day" sets={sets} backHref="/friends/bob" />,
  );
  for (const name of ["Edit", "Delete", "Add"]) {
    await expect
      .element(screen.getByRole("button", { name }))
      .not.toBeInTheDocument();
  }
});
