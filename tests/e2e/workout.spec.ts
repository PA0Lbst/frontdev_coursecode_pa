import { expect, test } from "@playwright/test";
import { register } from "./helpers/auth";

test("workout set add, edit, and delete persist across reloads", async ({
  page,
}) => {
  const workout = `e2e-workout-${Date.now()}`;
  const exercise = `e2e-set-${Date.now()}`;
  const editedExercise = `${exercise}-edited`;

  await register(page);
  await expect(page.getByRole("heading", { name: "Gymtiiime" })).toBeVisible();

  await page.getByRole("textbox", { name: "Name" }).fill(workout);
  await page.getByRole("button", { name: "Add workout" }).click();
  await expect(page).toHaveURL(/\/workouts\/\d+$/);
  await expect(page.getByRole("heading", { name: workout })).toBeVisible();

  await page.getByRole("combobox", { name: "Exercise" }).fill(exercise);
  await page.getByRole("spinbutton", { name: "Reps" }).fill("5");
  await page.getByRole("spinbutton", { name: "Weight (kg)" }).fill("20");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: exercise }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: exercise }),
  ).toBeVisible();

  await page
    .getByRole("listitem")
    .filter({ hasText: exercise })
    .getByRole("button", { name: "Edit" })
    .click();
  const editingRow = page.getByRole("listitem").filter({
    has: page.getByRole("button", { name: "Save" }),
  });
  await editingRow
    .getByRole("combobox", { name: "Exercise" })
    .fill(editedExercise);
  await editingRow.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: editedExercise }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: editedExercise }),
  ).toBeVisible();

  await page
    .getByRole("listitem")
    .filter({ hasText: editedExercise })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(
    page.getByRole("listitem").filter({ hasText: editedExercise }),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: editedExercise }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Back to workouts" }).click();
  await page.getByRole("button", { name: `Actions for ${workout}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: workout })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("link", { name: workout })).toHaveCount(0);
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("create, open from the card, and delete a workout", async ({ page }) => {
    const workout = `e2e-mobile-${Date.now()}`;

    await register(page);
    await page.getByRole("textbox", { name: "Name" }).fill(workout);
    await page.getByRole("button", { name: "Add workout" }).click();
    await expect(page).toHaveURL(/\/workouts\/\d+$/);
    await expect(page.getByRole("heading", { name: workout })).toBeVisible();

    await page.getByRole("link", { name: "Back to workouts" }).click();
    await page.getByRole("button", { name: `Actions for ${workout}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("link", { name: workout })).toHaveCount(0);
  });
});
