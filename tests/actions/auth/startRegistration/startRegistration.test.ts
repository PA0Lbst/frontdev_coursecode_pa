import { expect, test } from "vitest";
import { startRegistration } from "@/actions/auth/startRegistration/startRegistration";
import { prisma } from "@/prisma/prismaClient";

test("returns options and stores a challenge for the normalized username", async () => {
  const started = await startRegistration("  Alice_1 ");
  if ("error" in started) throw new Error(started.error);
  const { challengeId, options } = started;

  const stored = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });
  expect(stored?.purpose).toBe("register");
  expect(stored?.username).toBe("alice_1");
  expect(stored?.challenge).toBe(options.challenge);
});

test("rejects invalid usernames", async () => {
  await expect(startRegistration("ab")).rejects.toThrow("Invalid username");
  await expect(startRegistration("has space")).rejects.toThrow(
    "Invalid username",
  );
});

test("rejects a taken username", async () => {
  await prisma.user.create({ data: { username: "alice" } });
  expect(await startRegistration("ALICE")).toEqual({
    error: "That username is taken.",
  });
});
