import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { type SendFriendRequestResult } from "@/data/friendship";
import { FriendsPage, type FriendsPageProps } from "./FriendsPage";

const bob = { id: 1, user: { id: 2, username: "bob" } };
const carol = { id: 2, user: { id: 3, username: "carol" } };

function props(overrides: Partial<FriendsPageProps> = {}): FriendsPageProps {
  return {
    initialFriendships: { friends: [], incoming: [], outgoing: [] },
    sendFriendRequest: vi.fn(async (name: string) => ({
      entry: { id: 9, user: { id: 9, username: name } },
      status: "pending" as const,
    })),
    acceptFriendRequest: vi.fn(async () => bob),
    declineFriendRequest: vi.fn(async () => {}),
    cancelFriendRequest: vi.fn(async () => {}),
    removeFriend: vi.fn(async () => {}),
    ...overrides,
  };
}

test("empty state shows No friends yet and no Requests section", async () => {
  const screen = await render(<FriendsPage {...props()} />);
  await expect.element(screen.getByText("No friends yet.")).toBeVisible();
  await expect
    .element(screen.getByRole("heading", { name: "Requests" }))
    .not.toBeInTheDocument();
});

test("sending a request adds it to outgoing and clears the input", async () => {
  const p = props();
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("textbox", { name: "Username" }).fill("carol");
  await screen.getByRole("button", { name: "Send request" }).click();
  expect(p.sendFriendRequest).toHaveBeenCalledWith("carol");
  await expect
    .element(screen.getByRole("button", { name: "Cancel request to carol" }))
    .toBeVisible();
  await expect.element(screen.getByRole("textbox", { name: "Username" })).toHaveValue("");
});

test("an auto-accepted request moves from incoming to friends", async () => {
  const p = props({
    initialFriendships: { friends: [], incoming: [bob], outgoing: [] },
    sendFriendRequest: vi.fn(async () => ({ entry: bob, status: "accepted" as const })),
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("textbox", { name: "Username" }).fill("bob");
  await screen.getByRole("button", { name: "Send request" }).click();
  await expect.element(screen.getByRole("link", { name: "bob" })).toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Accept bob" }))
    .not.toBeInTheDocument();
});

test("friendly errors are shown and the input keeps its value", async () => {
  const p = props({
    sendFriendRequest: vi.fn(async () => ({ error: "User not found" as const })),
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("textbox", { name: "Username" }).fill("nobody");
  await screen.getByRole("button", { name: "Send request" }).click();
  await expect.element(screen.getByRole("alert")).toHaveTextContent("User not found");
  await expect.element(screen.getByRole("textbox", { name: "Username" })).toHaveValue("nobody");
});

test("a thrown error shows the generic alert", async () => {
  const p = props({
    sendFriendRequest: vi.fn(async () => {
      throw new Error("boom");
    }),
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("textbox", { name: "Username" }).fill("carol");
  await screen.getByRole("button", { name: "Send request" }).click();
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
});

test("Accept moves the request into friends", async () => {
  const p = props({
    initialFriendships: { friends: [], incoming: [bob], outgoing: [carol] },
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("button", { name: "Accept bob" }).click();
  expect(p.acceptFriendRequest).toHaveBeenCalledWith(1);
  await expect.element(screen.getByRole("link", { name: "bob" })).toBeVisible();
});

test("Decline, Cancel and Remove drop the row", async () => {
  const p = props({
    initialFriendships: { friends: [{ id: 5, user: { id: 8, username: "dave" } }], incoming: [bob], outgoing: [carol] },
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("button", { name: "Decline bob" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Decline bob" }))
    .not.toBeInTheDocument();
  await screen.getByRole("button", { name: "Cancel request to carol" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Cancel request to carol" }))
    .not.toBeInTheDocument();
  await screen.getByRole("button", { name: "Remove dave" }).click();
  await expect.element(screen.getByText("No friends yet.")).toBeVisible();
});

test("a failed mutation keeps the row and shows the generic alert", async () => {
  const p = props({
    initialFriendships: { friends: [], incoming: [bob], outgoing: [] },
    declineFriendRequest: vi.fn(async () => {
      throw new Error("boom");
    }),
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("button", { name: "Decline bob" }).click();
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
  await expect.element(screen.getByRole("button", { name: "Decline bob" })).toBeVisible();
});

test("Send request is disabled while pending", async () => {
  let finish: () => void = () => {};
  const p = props({
    sendFriendRequest: vi.fn(
      () =>
        new Promise<SendFriendRequestResult>((resolve) => {
          finish = () => resolve({ error: "User not found" as const });
        }),
    ),
  });
  const screen = await render(<FriendsPage {...p} />);
  await screen.getByRole("textbox", { name: "Username" }).fill("carol");
  await screen.getByRole("button", { name: "Send request" }).click();
  await expect.element(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
  finish();
  await expect.element(screen.getByRole("button", { name: "Send request" })).toBeEnabled();
});
