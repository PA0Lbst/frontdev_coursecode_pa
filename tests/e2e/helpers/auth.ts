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
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport,
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return { cdp, authenticatorId };
}

// Off: the authenticator stops answering on its own, so a pending autofill request cannot sign in.
export async function setUserPresence(
  { cdp, authenticatorId }: Awaited<ReturnType<typeof addVirtualAuthenticator>>,
  enabled: boolean,
) {
  await cdp.send("WebAuthn.setAutomaticPresenceSimulation", {
    authenticatorId,
    enabled,
  });
}

export async function register(page: Page, username = uniqueUsername()) {
  await addVirtualAuthenticator(page);
  return registerWith(page, username);
}

// Signs up with an authenticator the caller already added.
export async function registerWith(page: Page, username = uniqueUsername()) {
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");
  return username;
}
