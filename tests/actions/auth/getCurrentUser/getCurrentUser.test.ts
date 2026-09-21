import { expect, test } from "vitest";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { prisma } from "@/prisma/prismaClient";
import { signInAs, signOutCookie } from "../../helpers/auth";

test("returns null without a cookie", async () => {
  expect(await getCurrentUser()).toBeNull();
});

test("returns the signed-in user without exposing extra fields", async () => {
  const user = await signInAs("alice");
  expect(await getCurrentUser()).toEqual({
    id: user.id,
    username: "alice",
    createdAt: user.createdAt,
  });
  signOutCookie();
  expect(await getCurrentUser()).toBeNull();
});

test("returns null for an expired session", async () => {
  await signInAs("alice");
  await prisma.authSession.updateMany({
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect(await getCurrentUser()).toBeNull();
});
