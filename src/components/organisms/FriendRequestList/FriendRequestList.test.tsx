import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { FriendRequestList } from "./FriendRequestList";

const incoming = [{ id: 1, user: { id: 2, username: "bob" } }];
const outgoing = [{ id: 2, user: { id: 3, username: "carol" } }];

function setup(overrides = {}) {
  const props = {
    incoming,
    outgoing,
    onAccept: vi.fn(async () => {}),
    onDecline: vi.fn(async () => {}),
    onCancel: vi.fn(async () => {}),
    ...overrides,
  };
  return { props, screen: render(<FriendRequestList {...props} />) };
}

test("renders nothing when there are no requests", async () => {
  const { screen } = setup({ incoming: [], outgoing: [] });
  await expect
    .element((await screen).getByRole("heading", { name: "Requests" }))
    .not.toBeInTheDocument();
});

test("Accept and Decline call back with the request id", async () => {
  const { props, screen } = setup();
  const view = await screen;
  await view.getByRole("button", { name: "Accept bob" }).click();
  expect(props.onAccept).toHaveBeenCalledWith(1);
  await view.getByRole("button", { name: "Decline bob" }).click();
  expect(props.onDecline).toHaveBeenCalledWith(1);
});

test("Cancel is offered for outgoing requests", async () => {
  const { props, screen } = setup();
  const view = await screen;
  await view.getByRole("button", { name: "Cancel request to carol" }).click();
  expect(props.onCancel).toHaveBeenCalledWith(2);
});

test("the pressed button is disabled while the callback is pending", async () => {
  let finish: () => void = () => {};
  const { screen } = setup({
    onAccept: vi.fn(() => new Promise<void>((resolve) => (finish = resolve))),
  });
  const view = await screen;
  await view.getByRole("button", { name: "Accept bob" }).click();
  await expect.element(view.getByRole("button", { name: "Accept bob" })).toBeDisabled();
  await expect.element(view.getByRole("button", { name: "Decline bob" })).toBeEnabled();
  finish();
  await expect.element(view.getByRole("button", { name: "Accept bob" })).toBeEnabled();
});
