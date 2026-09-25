import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SignInPage, type SignInPageProps } from "./SignInPage";

type Mocks = Record<string, ReturnType<typeof vi.fn>>;

const push = vi.hoisted(() => vi.fn());
const browser = vi.hoisted(() => ({
  browserSupportsWebAuthn: vi.fn(() => true),
  browserSupportsWebAuthnAutofill: vi.fn(async () => true),
  startRegistration: vi.fn(async () => ({ id: "cred" })),
  startAuthentication: vi.fn<
    (input: { useBrowserAutofill?: boolean }) => Promise<unknown>
  >(async () => ({ id: "cred" })),
}));

const HINT = "gymtiiime:passkey";

type AuthCall = [{ useBrowserAutofill?: boolean }];

function modalCalls() {
  return (browser.startAuthentication.mock.calls as AuthCall[]).filter(
    ([input]) => !input.useBrowserAutofill,
  );
}

function autofillCalls() {
  return (browser.startAuthentication.mock.calls as AuthCall[]).filter(
    ([input]) => input.useBrowserAutofill,
  );
}

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
  localStorage.clear();
  push.mockClear();
  browser.browserSupportsWebAuthn.mockReturnValue(true);
  browser.browserSupportsWebAuthnAutofill.mockReset();
  browser.browserSupportsWebAuthnAutofill.mockResolvedValue(true);
  browser.startRegistration.mockClear();
  browser.startAuthentication.mockReset();
  // Autofill requests stay pending unless a test says otherwise.
  browser.startAuthentication.mockImplementation(async (input) =>
    input.useBrowserAutofill ? new Promise(() => {}) : { id: "cred" },
  );
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
  localStorage.setItem(HINT, "1");
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
  localStorage.setItem(HINT, "1");
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
  localStorage.setItem(HINT, "1");
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
  localStorage.setItem(HINT, "1");
  await render(
    <SignInPage
      autoPrompt={false}
      {...(props() as unknown as SignInPageProps)}
    />,
  );

  await vi.waitFor(() => expect(autofillCalls()).toHaveLength(1));
  expect(modalCalls()).toHaveLength(0);
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

test("without a hint, shows the forms at once and only arms autofill", async () => {
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .toBeVisible();
  await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
  await vi.waitFor(() =>
    expect(browser.startAuthentication).toHaveBeenCalledTimes(1),
  );
  expect(autofillCalls()).toHaveLength(1);
  expect(modalCalls()).toHaveLength(0);
});

test("with a hint, opens the sheet on load and signs in", async () => {
  localStorage.setItem(HINT, "1");
  await render(<SignInPage {...(props() as unknown as SignInPageProps)} />);

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(modalCalls()).toHaveLength(1);
  expect(autofillCalls()).toHaveLength(0);
});

test("a failed automatic attempt clears the hint and arms autofill", async () => {
  localStorage.setItem(HINT, "1");
  browser.startAuthentication.mockImplementation(async (input) => {
    if (input.useBrowserAutofill) return new Promise(() => {});
    throw new Error("NotAllowed");
  });
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .toBeVisible();
  await vi.waitFor(() => expect(autofillCalls()).toHaveLength(1));
  expect(localStorage.getItem(HINT)).toBeNull();
  await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
});

test("ignores an aborted autofill request", async () => {
  browser.startAuthentication.mockImplementation(async () => {
    throw Object.assign(new Error("aborted"), { name: "AbortError" });
  });
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await vi.waitFor(() => expect(autofillCalls()).toHaveLength(1));
  await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
});

test("stays quiet when the browser refuses the autofill request", async () => {
  browser.startAuthentication.mockImplementation(async () => {
    throw Object.assign(new Error("refused"), { name: "NotAllowedError" });
  });
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await vi.waitFor(() => expect(autofillCalls()).toHaveLength(1));
  await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
});

test("shows the generic alert when the server rejects an autofill passkey", async () => {
  browser.startAuthentication.mockImplementation(async () => ({ id: "cred" }));
  const p = props({
    finishAuthentication: vi.fn(async () => {
      throw new Error("secret detail");
    }),
  });
  const screen = await render(
    <SignInPage {...(p as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Something went wrong. Try again.");
  expect(push).not.toHaveBeenCalled();
});

test("signs in through autofill and sets the hint", async () => {
  browser.startAuthentication.mockImplementation(async () => ({ id: "cred" }));
  await render(<SignInPage {...(props() as unknown as SignInPageProps)} />);

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(autofillCalls()).toHaveLength(1);
  expect(localStorage.getItem(HINT)).toBe("1");
});

test("registering sets the hint", async () => {
  const screen = await render(
    <SignInPage
      autoPrompt={false}
      {...(props() as unknown as SignInPageProps)}
    />,
  );

  await screen.getByRole("textbox", { name: "Username" }).fill("alice");
  await screen.getByRole("button", { name: "Create account" }).click();

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(localStorage.getItem(HINT)).toBe("1");
});

test("signing in with the button sets the hint", async () => {
  const screen = await render(
    <SignInPage
      autoPrompt={false}
      {...(props() as unknown as SignInPageProps)}
    />,
  );

  await screen.getByRole("button", { name: "Sign in with passkey" }).click();

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(localStorage.getItem(HINT)).toBe("1");
});

test("does not arm autofill when the browser lacks it", async () => {
  browser.browserSupportsWebAuthnAutofill.mockResolvedValue(false);
  const screen = await render(
    <SignInPage {...(props() as unknown as SignInPageProps)} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "Create account" }))
    .toBeVisible();
  await vi.waitFor(() =>
    expect(browser.browserSupportsWebAuthnAutofill).toHaveBeenCalled(),
  );
  expect(browser.startAuthentication).not.toHaveBeenCalled();
});

test("the button reuses the pending autofill challenge", async () => {
  const p = props();
  const screen = await render(
    <SignInPage {...(p as unknown as SignInPageProps)} />,
  );
  await vi.waitFor(() => expect(autofillCalls()).toHaveLength(1));

  await screen.getByRole("button", { name: "Sign in with passkey" }).click();

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(p.startAuthentication).toHaveBeenCalledTimes(1);
  expect(p.finishAuthentication).toHaveBeenCalledWith({
    challengeId: 2,
    response: { id: "cred" },
  });
});
