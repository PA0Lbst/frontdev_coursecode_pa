import { expect, test } from "vitest";
import { SESSION_COOKIE } from "@/actions/auth/config";
import { finishAuthentication } from "@/actions/auth/finishAuthentication/finishAuthentication";
import { finishRegistration } from "@/actions/auth/finishRegistration/finishRegistration";
import { startAuthentication } from "@/actions/auth/startAuthentication/startAuthentication";
import { prisma } from "@/prisma/prismaClient";
import { beginRegistration, createAuthenticator } from "../../helpers/auth";
import { cookieJar, resetCookies } from "../../helpers/cookieStore";

async function registered(username = "alice") {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration(username);
  await finishRegistration({
    challengeId,
    response: authenticator.register(options),
  });
  resetCookies();
  return authenticator;
}

test("startAuthentication stores a challenge", async () => {
  const { challengeId, options } = await startAuthentication();
  const stored = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });
  expect(stored?.purpose).toBe("authenticate");
  expect(stored?.challenge).toBe(options.challenge);
});

test("a valid assertion signs the user in and bumps the counter", async () => {
  const authenticator = await registered();
  const { challengeId, options } = await startAuthentication();

  const user = await finishAuthentication({
    challengeId,
    response: authenticator.assert(options),
  });

  expect(user.username).toBe("alice");
  expect(cookieJar.get(SESSION_COOKIE)).toEqual(expect.any(String));
  const passkey = await prisma.passkey.findUnique({
    where: { id: authenticator.id },
  });
  expect(passkey?.counter).toBe(1);
});

test("rejects an assertion for the wrong challenge", async () => {
  const authenticator = await registered();
  const first = await startAuthentication();
  const second = await startAuthentication();

  await expect(
    finishAuthentication({
      challengeId: second.challengeId,
      response: authenticator.assert(first.options),
    }),
  ).rejects.toThrow("Invalid credentials");
  expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
});

test("rejects an unknown credential", async () => {
  await registered();
  const stranger = createAuthenticator();
  const { challengeId, options } = await startAuthentication();

  await expect(
    finishAuthentication({ challengeId, response: stranger.assert(options) }),
  ).rejects.toThrow("Invalid credentials");
});

test("rejects a replayed counter", async () => {
  const authenticator = await registered();
  const ok = await startAuthentication();
  await finishAuthentication({
    challengeId: ok.challengeId,
    response: authenticator.assert(ok.options, { counter: 5 }),
  });
  resetCookies();

  const replay = await startAuthentication();
  await expect(
    finishAuthentication({
      challengeId: replay.challengeId,
      response: authenticator.assert(replay.options, { counter: 5 }),
    }),
  ).rejects.toThrow("Invalid credentials");
});

test("a challenge can only be used once", async () => {
  const authenticator = await registered();
  const { challengeId, options } = await startAuthentication();
  const response = authenticator.assert(options);
  await finishAuthentication({ challengeId, response });

  await expect(finishAuthentication({ challengeId, response })).rejects.toThrow(
    "Invalid challenge",
  );
});
