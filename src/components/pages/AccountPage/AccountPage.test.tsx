import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AccountPage, type AccountPageProps } from "./AccountPage";

type Mocks = Record<string, ReturnType<typeof vi.fn>>;

const browser = vi.hoisted(() => ({
  startRegistration: vi.fn(async () => ({ id: "cred" })),
}));
vi.mock("@simplewebauthn/browser", () => browser);

const passkeys = [
  { id: "a", label: "Laptop", createdAt: new Date("2026-01-15T00:00:00.000Z") },
  { id: "b", label: null, createdAt: new Date("2026-01-16T00:00:00.000Z") },
];

function props(overrides = {}) {
  return {
    username: "alice",
    initialPasskeys: passkeys,
    startAddPasskey: vi.fn(async () => ({
      challengeId: 1,
      options: { challenge: "c" },
    })),
    finishAddPasskey: vi.fn(async () => ({
      id: "c",
      label: "Phone",
      createdAt: new Date("2026-01-17T00:00:00.000Z"),
    })),
    removePasskey: vi.fn(async () => {}),
    ...overrides,
  } as unknown as Mocks;
}

beforeEach(() => {
  localStorage.clear();
  browser.startRegistration.mockClear();
});

test("lists passkeys with created dates", async () => {
  const screen = await render(<AccountPage {...(props() as unknown as AccountPageProps)} />);
  await expect.element(screen.getByText("Laptop")).toBeVisible();
  await expect.element(screen.getByText("Passkey 2")).toBeVisible();
  await expect.element(screen.getByText("2026-01-15")).toBeVisible();
});

test("adds a passkey and appends it locally", async () => {
  const p = props();
  const screen = await render(<AccountPage {...(p as unknown as AccountPageProps)} />);

  await screen.getByRole("button", { name: "Add a passkey" }).click();

  await expect.element(screen.getByText("Phone")).toBeVisible();
  expect(
    p.finishAddPasskey,
  ).toHaveBeenCalledWith({ challengeId: 1, response: { id: "cred" } });
});

test("removes a passkey", async () => {
  const p = props();
  const screen = await render(<AccountPage {...(p as unknown as AccountPageProps)} />);

  await screen.getByRole("button", { name: "Remove Laptop" }).click();

  await expect.element(screen.getByText("Laptop")).not.toBeInTheDocument();
  expect(
    p.removePasskey,
  ).toHaveBeenCalledWith("a");
});

test("shows the last-passkey message and keeps the list", async () => {
  const p = props({
    removePasskey: vi.fn(async () => ({
      error: "You need at least one passkey.",
    })),
  });
  const screen = await render(<AccountPage {...(p as unknown as AccountPageProps)} />);

  await screen.getByRole("button", { name: "Remove Laptop" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("You need at least one passkey.");
  await expect.element(screen.getByText("Laptop")).toBeVisible();
});

test("shows a generic alert for other failures", async () => {
  const p = props({
    startAddPasskey: vi.fn(async () => {
      throw new Error("secret");
    }),
  });
  const screen = await render(<AccountPage {...(p as unknown as AccountPageProps)} />);

  await screen.getByRole("button", { name: "Add a passkey" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
});

test("adding a passkey sets the hint", async () => {
  const screen = await render(
    <AccountPage {...(props() as unknown as AccountPageProps)} />,
  );

  await screen.getByRole("button", { name: "Add a passkey" }).click();

  await expect.element(screen.getByText("Phone")).toBeVisible();
  expect(localStorage.getItem("gymtiiime:passkey")).toBe("1");
});
