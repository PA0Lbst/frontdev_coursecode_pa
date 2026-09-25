import { expect, test } from "@playwright/test";
import {
  addVirtualAuthenticator,
  register,
  registerWith,
  setUserPresence,
} from "./helpers/auth";

test("signed-out visitors are sent to /sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("register, sign out, sign back in with the passkey", async ({ page }) => {
  const auth = await addVirtualAuthenticator(page);
  const username = await registerWith(page);
  const workout = `e2e-auth-${Date.now()}`;

  await page.getByRole("textbox", { name: "Name" }).fill(workout);
  await page.getByRole("button", { name: "Add workout" }).click();
  await expect(page).toHaveURL(/\/workouts\/\d+$/);
  await page.getByRole("link", { name: "Back to workouts" }).click();
  await expect(page.getByRole("link", { name: workout })).toBeVisible();
  await expect(page.getByRole("link", { name: username })).toBeVisible();

  await setUserPresence(auth, false);
  await page.getByRole("button", { name: "Sign out" }).click();
  // An explicit sign-out must not be undone by the automatic attempt.
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1$/);
  await expect(
    page.getByRole("button", { name: "Sign in with passkey" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1$/);

  await setUserPresence(auth, true);
  await page.getByRole("button", { name: "Sign in with passkey" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: workout })).toBeVisible();

  await page.getByRole("button", { name: `Actions for ${workout}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: workout })).toHaveCount(0);
});

test("opening /sign-in with a passkey signs in automatically", async ({
  page,
}) => {
  await register(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1$/);

  await page.goto("/sign-in");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("opening /sign-in without a passkey ends on the create-account form", async ({
  page,
}) => {
  await addVirtualAuthenticator(page);
  await page.goto("/sign-in");

  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with passkey" }),
  ).toBeVisible();
  await expect(page.locator("p[role=alert]")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("without the hint, the sheet only opens on the button", async ({
  page,
}) => {
  const auth = await addVirtualAuthenticator(page);
  await registerWith(page);
  await setUserPresence(auth, false);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1$/);
  await page.evaluate(() => localStorage.clear());

  await page.goto("/sign-in");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page).toHaveURL(/\/sign-in$/);

  await setUserPresence(auth, true);
  await page.getByRole("button", { name: "Sign in with passkey" }).click();
  await expect(page).toHaveURL("/");
});

test("the account page lists the passkey and refuses to remove the last one", async ({
  page,
}) => {
  await register(page);
  await page.getByRole("link", { name: /^e2e_/ }).click();
  await expect(page).toHaveURL(/\/account$/);

  // The first authenticator already holds a credential (excluded), so add a second device.
  await addVirtualAuthenticator(page, "usb");
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(2);

  await page.getByRole("button", { name: /^Remove/ }).first().click();
  await expect(page.getByRole("button", { name: /^Remove/ })).toHaveCount(1);

  await page.getByRole("button", { name: /^Remove/ }).click();
  await expect(page.locator("p[role=alert]")).toHaveText(
    "You need at least one passkey.",
  );
});
