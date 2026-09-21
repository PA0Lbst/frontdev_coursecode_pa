import { beforeEach, expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { signInAs, signOutCookie } from "../../helpers/auth";
import { prisma } from "@/prisma/prismaClient";

beforeEach(async () => {
  await signInAs("alice");
});

test("persists and returns a session with generated id and createdAt", async () => {
  const session = await createSession({ name: "Push Day" });

  expect(session.id).toEqual(expect.any(Number));
  expect(session.createdAt).toBeInstanceOf(Date);
  expect(session.name).toBe("Push Day");

  const stored = await prisma.workoutSession.findUnique({
    where: { id: session.id },
  });
  expect(stored).toEqual(session);
});

test("trims name", async () => {
  const session = await createSession({ name: "  Leg Day  " });
  expect(session.name).toBe("Leg Day");
});

test("blank name becomes null and missing name is null", async () => {
  const blank = await createSession({ name: "   " });
  expect(blank.name).toBeNull();

  const missing = await createSession({});
  expect(missing.name).toBeNull();
});

test("assigns the current user as owner", async () => {
  const session = await createSession({ name: "Mine" });
  const stored = await prisma.workoutSession.findUnique({
    where: { id: session.id },
    include: { user: true },
  });
  expect(stored?.user.username).toBe("alice");
});

test("rejects when signed out", async () => {
  signOutCookie();
  await expect(createSession({ name: "x" })).rejects.toThrow("Unauthorized");
});
