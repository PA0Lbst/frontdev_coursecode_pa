import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { FriendList } from "./FriendList";

const friends = [{ id: 1, user: { id: 2, username: "bob" } }];

test("empty list shows the empty message", async () => {
  const screen = await render(<FriendList friends={[]} onRemove={vi.fn()} />);
  await expect.element(screen.getByText("No friends yet.")).toBeVisible();
});

test("each friend links to their workouts", async () => {
  const screen = await render(<FriendList friends={friends} onRemove={vi.fn()} />);
  await expect
    .element(screen.getByRole("link", { name: "bob" }))
    .toHaveAttribute("href", "/friends/bob");
});

test("Remove calls onRemove with the friendship id", async () => {
  const onRemove = vi.fn(async () => {});
  const screen = await render(<FriendList friends={friends} onRemove={onRemove} />);
  await screen.getByRole("button", { name: "Remove bob" }).click();
  expect(onRemove).toHaveBeenCalledWith(1);
});

test("Remove is disabled while pending", async () => {
  let finish: () => void = () => {};
  const onRemove = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
  const screen = await render(<FriendList friends={friends} onRemove={onRemove} />);
  await screen.getByRole("button", { name: "Remove bob" }).click();
  await expect.element(screen.getByRole("button", { name: "Remove bob" })).toBeDisabled();
  finish();
  await expect.element(screen.getByRole("button", { name: "Remove bob" })).toBeEnabled();
});
