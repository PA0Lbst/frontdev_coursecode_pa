import { expect, test } from "vitest";
import { finishAddPasskey } from "@/actions/auth/finishAddPasskey/finishAddPasskey";
import { listPasskeys } from "@/actions/auth/listPasskeys/listPasskeys";
import { removePasskey } from "@/actions/auth/removePasskey/removePasskey";
import { startAddPasskey } from "@/actions/auth/startAddPasskey/startAddPasskey";
import { prisma } from "@/prisma/prismaClient";
import {
  createAuthenticator,
  signInAs,
  signOutCookie,
} from "../../helpers/auth";

async function addPasskey(label?: string) {
  const authenticator = createAuthenticator();
  const { challengeId, options } = await startAddPasskey();
  const passkey = await finishAddPasskey({
    challengeId,
    response: authenticator.register(options),
    label,
  });
  return { authenticator, passkey };
}

test("requires a signed-in user", async () => {
  await expect(listPasskeys()).rejects.toThrow("Unauthorized");
  await expect(startAddPasskey()).rejects.toThrow("Unauthorized");
});

test("adds and lists passkeys without exposing key material", async () => {
  await signInAs("alice");
  const { passkey } = await addPasskey("Laptop");

  const list = await listPasskeys();
  expect(list).toEqual([
    { id: passkey.id, label: "Laptop", createdAt: expect.any(Date) },
  ]);
});

test("a challenge started by one user cannot be finished by another", async () => {
  await signInAs("alice");
  const { challengeId, options } = await startAddPasskey();
  signOutCookie();
  await signInAs("bob");

  await expect(
    finishAddPasskey({
      challengeId,
      response: createAuthenticator().register(options),
    }),
  ).rejects.toThrow("Invalid challenge");
});

test("removes a passkey but never the last one", async () => {
  await signInAs("alice");
  const first = await addPasskey();
  const second = await addPasskey();

  await removePasskey(first.passkey.id);
  expect((await listPasskeys()).map((p) => p.id)).toEqual([second.passkey.id]);

  expect(await removePasskey(second.passkey.id)).toEqual({
    error: "You need at least one passkey.",
  });
  expect(await listPasskeys()).toHaveLength(1);
});

test("cannot remove another user's passkey", async () => {
  await signInAs("alice");
  const { passkey } = await addPasskey();
  signOutCookie();
  await signInAs("bob");

  await expect(removePasskey(passkey.id)).rejects.toThrow("Not found");
  expect(await prisma.passkey.count()).toBe(1);
});
