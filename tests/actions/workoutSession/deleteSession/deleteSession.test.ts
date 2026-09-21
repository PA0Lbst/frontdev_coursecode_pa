import { beforeEach, expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSession } from "@/actions/workoutSession/deleteSession/deleteSession";
import { signInAs, signOutCookie } from "../../helpers/auth";
import { prisma } from "@/prisma/prismaClient";

beforeEach(async () => {
  await signInAs("alice");
});

test("removes the session and cascades its sets", async () => {
  const session = await createSession({ name: "Push Day" });
  const set = await createSet({
    sessionId: session.id,
    exercise: "Bench Press",
    reps: 5,
    weight: 60,
  });

  await deleteSession(session.id);

  expect(
    await prisma.workoutSession.findUnique({ where: { id: session.id } }),
  ).toBeNull();
  expect(
    await prisma.workoutSet.findUnique({ where: { id: set.id } }),
  ).toBeNull();
});

test("unknown id throws", async () => {
  await expect(deleteSession(999999)).rejects.toThrow("Not found");
});

test("cannot delete another user's session", async () => {
  const session = await createSession({ name: "Alice's" });
  signOutCookie();
  await signInAs("bob");

  await expect(deleteSession(session.id)).rejects.toThrow("Not found");
  expect(
    await prisma.workoutSession.findUnique({ where: { id: session.id } }),
  ).not.toBeNull();
});
