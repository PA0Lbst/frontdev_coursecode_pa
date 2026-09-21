import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { FriendWorkoutsPage } from "./FriendWorkoutsPage";

const session = {
  id: 4,
  userId: 2,
  name: "Push day",
  createdAt: new Date("2026-01-15T00:00:00.000Z"),
  setCount: 3,
};

test("cards link to the friend's workout and have no delete menu", async () => {
  const screen = await render(
    <FriendWorkoutsPage friendUsername="bob" sessions={[session]} />,
  );
  await expect
    .element(screen.getByRole("link", { name: /Push day/ }))
    .toHaveAttribute("href", "/friends/bob/4");
  await expect
    .element(screen.getByRole("button", { name: /Actions for/ }))
    .not.toBeInTheDocument();
});

test("shows a back link and the empty message", async () => {
  const screen = await render(
    <FriendWorkoutsPage friendUsername="bob" sessions={[]} />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Back to friends" }))
    .toHaveAttribute("href", "/friends");
  await expect.element(screen.getByText("No workouts yet.")).toBeVisible();
});
