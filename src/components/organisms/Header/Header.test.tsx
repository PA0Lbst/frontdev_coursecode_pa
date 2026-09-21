import { expect, test, vi } from "vitest";
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
