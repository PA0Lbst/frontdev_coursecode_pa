import { expect, test, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

import { render } from "vitest-browser-react";
import { Header } from "./Header";

test("renders a visible heading named Workoutish", async () => {
  const screen = await render(<Header />);
  await expect
    .element(screen.getByRole("heading", { name: "Workoutish" }))
    .toBeVisible();
});

test("shows no account controls when signed out", async () => {
  const screen = await render(<Header />);
  await expect
    .element(screen.getByRole("button", { name: "Sign out" }))
    .not.toBeInTheDocument();
});

test("shows the username linking to /account and signs out", async () => {
  const onSignOut = vi.fn(async () => {});
  const screen = await render(<Header username="alice" onSignOut={onSignOut} />);

  await expect
    .element(screen.getByRole("link", { name: "alice" }))
    .toHaveAttribute("href", "/account");
  await screen.getByRole("button", { name: "Sign out" }).click();
  expect(onSignOut).toHaveBeenCalledTimes(1);
});

test("disables Sign out while it is pending", async () => {
  let finish: () => void = () => {};
  const onSignOut = vi.fn(
    () => new Promise<void>((resolve) => (finish = resolve)),
  );
  const screen = await render(<Header username="alice" onSignOut={onSignOut} />);

  await screen.getByRole("button", { name: "Sign out" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Sign out" }))
    .toBeDisabled();
  finish();
  await expect
    .element(screen.getByRole("button", { name: "Sign out" }))
    .toBeEnabled();
});

test("signed-in nav links Workouts and Friends and marks the current page", async () => {
  navigation.pathname = "/friends/bob";
  const screen = await render(<Header username="alice" />);
  const nav = screen.getByRole("navigation", { name: "Main" });
  await expect
    .element(nav.getByRole("link", { name: "Workouts" }))
    .toHaveAttribute("href", "/");
  await expect
    .element(nav.getByRole("link", { name: /Friends/ }))
    .toHaveAttribute("aria-current", "page");
  await expect
    .element(nav.getByRole("link", { name: "Workouts" }))
    .not.toHaveAttribute("aria-current");
});

test("marks Workouts on workout pages", async () => {
  navigation.pathname = "/workouts/3";
  const screen = await render(<Header username="alice" />);
  await expect
    .element(screen.getByRole("link", { name: "Workouts" }))
    .toHaveAttribute("aria-current", "page");
});

test("shows the pending request badge only when the count is above zero", async () => {
  navigation.pathname = "/";
  const withBadge = await render(<Header username="alice" pendingRequestCount={3} />);
  await expect
    .element(withBadge.getByRole("link", { name: /3 pending requests/ }))
    .toBeVisible();
  await withBadge.unmount();
  const without = await render(<Header username="alice" pendingRequestCount={0} />);
  await expect
    .element(without.getByRole("link", { name: "Friends", exact: true }))
    .toBeVisible();
});

test("has no nav when signed out", async () => {
  const screen = await render(<Header />);
  await expect
    .element(screen.getByRole("navigation"))
    .not.toBeInTheDocument();
});
