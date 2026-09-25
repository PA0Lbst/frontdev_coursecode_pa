import { expect, type Page } from "@playwright/test";

export function uniqueUsername() {
  return `e2e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Chromium software authenticator so passkey ceremonies work headlessly.
export async function addVirtualAuthenticator(
  page: Page,
  transport: "internal" | "usb" = "internal",
) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport,
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

export async function register(page: Page, username = uniqueUsername()) {
  await addVirtualAuthenticator(page);
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
  return username;
}
