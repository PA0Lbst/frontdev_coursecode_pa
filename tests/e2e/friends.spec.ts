import { expect, test } from "@playwright/test";
import { register, uniqueUsername } from "./helpers/auth";

test("a friend can read my workout until I remove them", async ({ browser }) => {
  const alice = uniqueUsername();
  const bob = uniqueUsername();
  const workout = `e2e-shared-${Date.now()}`;
  const exercise = `e2e-lift-${Date.now()}`;

  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();
  const bobPage = await bobContext.newPage();

  await register(alicePage, alice);
  await alicePage.getByRole("textbox", { name: "Name" }).fill(workout);
  await alicePage.getByRole("button", { name: "Add workout" }).click();
  await expect(alicePage).toHaveURL(/\/workouts\/\d+$/);
  await alicePage.getByRole("combobox", { name: "Exercise" }).fill(exercise);
  await alicePage.getByRole("spinbutton", { name: "Reps" }).fill("5");
  await alicePage.getByRole("spinbutton", { name: "Weight (kg)" }).fill("20");
  await alicePage.getByRole("button", { name: "Add" }).click();
  await expect(alicePage.getByText(exercise)).toBeVisible();

  await register(bobPage, bob);
  await bobPage.getByRole("link", { name: "Friends" }).click();
  await expect(bobPage).toHaveURL("/friends");
  await bobPage.getByRole("textbox", { name: "Username" }).fill(alice);
  await bobPage.getByRole("button", { name: "Send request" }).click();
  await expect(
    bobPage.getByRole("button", { name: `Cancel request to ${alice}` }),
  ).toBeVisible();

  await alicePage.goto("/friends");
  await expect(
    alicePage.getByRole("link", { name: /Friends.*1 pending/ }),
  ).toBeVisible();
  await alicePage.getByRole("button", { name: `Accept ${bob}` }).click();
  await expect(alicePage.getByRole("link", { name: bob })).toBeVisible();

  await bobPage.goto("/friends");
  await bobPage.getByRole("link", { name: alice }).click();
  await expect(bobPage).toHaveURL(`/friends/${alice}`);
  await bobPage.getByRole("link", { name: new RegExp(workout) }).click();
  await expect(bobPage).toHaveURL(new RegExp(`/friends/${alice}/\\d+$`));
  await expect(bobPage.getByRole("heading", { name: workout })).toBeVisible();
  await expect(bobPage.getByText(exercise)).toBeVisible();
  for (const name of ["Edit", "Delete", "Add"]) {
    await expect(bobPage.getByRole("button", { name })).toHaveCount(0);
  }

  await alicePage.getByRole("button", { name: `Remove ${bob}` }).click();
  await expect(alicePage.getByRole("link", { name: bob })).toHaveCount(0);

  const response = await bobPage.goto(`/friends/${alice}`);
  expect(response?.status()).toBe(404);

  await aliceContext.close();
  await bobContext.close();
});
