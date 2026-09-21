import { expect, test } from "vitest";
import { SESSION_COOKIE } from "@/actions/auth/config";
import { finishRegistration } from "@/actions/auth/finishRegistration/finishRegistration";
import { prisma } from "@/prisma/prismaClient";
import { beginRegistration, createAuthenticator } from "../../helpers/auth";
import { cookieJar } from "../../helpers/cookieStore";

test("creates the user, the passkey and a session cookie", async () => {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration("alice");

  const user = await finishRegistration({
    challengeId,
    response: authenticator.register(options),
  });
  if ("error" in user) throw new Error(user.error);

  expect(user.username).toBe("alice");
  const passkey = await prisma.passkey.findUnique({
    where: { id: authenticator.id },
  });
  expect(passkey?.userId).toBe(user.id);
  expect(cookieJar.get(SESSION_COOKIE)).toEqual(expect.any(String));
  expect(await prisma.authSession.count()).toBe(1);
});

test("a challenge can only be used once", async () => {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration("alice");
  const response = authenticator.register(options);
  await finishRegistration({ challengeId, response });

  await expect(finishRegistration({ challengeId, response })).rejects.toThrow(
    "Invalid challenge",
  );
});

test("an expired challenge is rejected", async () => {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration("alice");
  await prisma.authChallenge.update({
    where: { id: challengeId },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });

  await expect(
    finishRegistration({
      challengeId,
      response: authenticator.register(options),
    }),
  ).rejects.toThrow("Invalid challenge");
  expect(await prisma.user.count()).toBe(0);
});

test("rejects a response from the wrong origin", async () => {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration("alice");

  await expect(
    finishRegistration({
      challengeId,
      response: authenticator.register(options, "https://evil.example"),
    }),
  ).rejects.toThrow();
  expect(await prisma.user.count()).toBe(0);
});

test("rejects when the username was taken in the meantime", async () => {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await beginRegistration("alice");
  await prisma.user.create({ data: { username: "alice" } });

  expect(
    await finishRegistration({
      challengeId,
      response: authenticator.register(options),
    }),
  ).toEqual({ error: "That username is taken." });
});
