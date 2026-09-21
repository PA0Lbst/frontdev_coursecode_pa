import { expect, test } from "vitest";
import { SESSION_COOKIE } from "@/actions/auth/config";
import { signOut } from "@/actions/auth/signOut/signOut";
import { prisma } from "@/prisma/prismaClient";
import { signInAs } from "../../helpers/auth";
import { cookieJar } from "../../helpers/cookieStore";

test("deletes the session row and cookie, then redirects", async () => {
  await signInAs("alice");

  await expect(signOut()).rejects.toMatchObject({
    digest: expect.stringContaining("/sign-in?signedOut=1"),
  });

  expect(await prisma.authSession.count()).toBe(0);
  expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
});
