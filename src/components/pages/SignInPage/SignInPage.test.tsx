import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SignInPage, type SignInPageProps } from "./SignInPage";

type Mocks = Record<string, ReturnType<typeof vi.fn>>;

const push = vi.hoisted(() => vi.fn());
const browser = vi.hoisted(() => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  startRegistration: vi.fn(async () => ({ id: "cred" })),
  startAuthentication: vi.fn(async () => ({ id: "cred" })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/sign-in",
}));
vi.mock("@simplewebauthn/browser", () => browser);

const options = { challenge: "c" };

function props(overrides = {}) {
  return {
    startRegistration: vi.fn(async () => ({ challengeId: 1, options })),
    finishRegistration: vi.fn(async () => ({})),
    startAuthentication: vi.fn(async () => ({ challengeId: 2, options })),
    finishAuthentication: vi.fn(async () => ({})),
    ...overrides,
  } as Mocks;
}

beforeEach(() => {
  push.mockClear();
  browser.browserSupportsWebAuthn.mockReturnValue(true);
  browser.startRegistration.mockClear();
  browser.startAuthentication.mockClear();
});

test("rejects an invalid username without calling the server", async () => {
  const p = props();
  const screen = await render(<SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />);

  await screen.getByRole("textbox", { name: "Username" }).fill("a");
  await screen.getByRole("button", { name: "Create account" }).click();

  await expect.element(screen.getByRole("alert")).toBeVisible();
  expect(
    p.startRegistration,
  ).not.toHaveBeenCalled();
});

test("registers then goes to /", async () => {
  const p = props();
  const screen = await render(<SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />);

  await screen.getByRole("textbox", { name: "Username" }).fill("alice");
  await screen.getByRole("button", { name: "Create account" }).click();

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  const typed = p as Record<string, ReturnType<typeof vi.fn>>;
  expect(typed.startRegistration).toHaveBeenCalledWith("alice");
  expect(typed.finishRegistration).toHaveBeenCalledWith({
    challengeId: 1,
    response: { id: "cred" },
  });
});

test("signs in with a passkey then goes to /", async () => {
  const p = props();
  const screen = await render(<SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />);

  await screen.getByRole("button", { name: "Sign in with passkey" }).click();

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(
    p.finishAuthentication,
  ).toHaveBeenCalledWith({ challengeId: 2, response: { id: "cred" } });
});

test("shows the username-taken message", async () => {
  const p = props({
    startRegistration: vi.fn(async () => ({
      error: "That username is taken.",
    })),
  });
  const screen = await render(<SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />);

  await screen.getByRole("textbox", { name: "Username" }).fill("alice");
  await screen.getByRole("button", { name: "Create account" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("That username is taken.");
  expect(push).not.toHaveBeenCalled();
});

test("shows a generic alert for other failures and never leaks the message", async () => {
  const p = props({
    finishAuthentication: vi.fn(async () => {
      throw new Error("secret detail");
    }),
  });
  const screen = await render(<SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />);

  await screen.getByRole("button", { name: "Sign in with passkey" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
  expect(push).not.toHaveBeenCalled();
});

test("explains when the browser lacks WebAuthn", async () => {
  browser.browserSupportsWebAuthn.mockReturnValue(false);
  const screen = await render(<SignInPage autoPrompt={false} {...(props() as unknown as SignInPageProps)} />);

  await screen.getByRole("button", { name: "Sign in with passkey" }).click();

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("This browser does not support passkeys.");
});

test("automatically signs in on open and never shows the forms", async () => {
  const p = props();
  const screen = await render(<SignInPage {...(p as unknown as SignInPageProps)} />);

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(p.startAuthentication).toHaveBeenCalledTimes(1);
  expect(p.finishAuthentication).toHaveBeenCalledWith({
    challengeId: 2,
    response: { id: "cred" },
  });
  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .not.toBeInTheDocument();
});

test("shows a status while the automatic attempt is pending", async () => {
  browser.startAuthentication.mockImplementationOnce(
    () => new Promise(() => {}),
  );
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Looking for your passkey…");
  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .not.toBeInTheDocument();
});

test("falls back to the forms without an alert when the automatic attempt fails", async () => {
  browser.startAuthentication.mockRejectedValueOnce(new Error("NotAllowed"));
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Sign in with passkey" }))
    .toBeVisible();
  await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});

test("makes no automatic attempt when autoPrompt is false", async () => {
  const p = props();
  await render(
    <SignInPage autoPrompt={false} {...(p as unknown as SignInPageProps)} />,
  );

  expect(p.startAuthentication).not.toHaveBeenCalled();
});

test("does not start the automatic attempt when the browser lacks WebAuthn", async () => {
  browser.browserSupportsWebAuthn.mockReturnValue(false);
  const p = props();
  const screen = await render(
    <SignInPage {...(p as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .toBeVisible();
  expect(p.startAuthentication).not.toHaveBeenCalled();
});
