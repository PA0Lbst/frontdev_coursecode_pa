import { beforeEach, expect, test } from "vitest";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSet } from "@/actions/workoutSet/deleteSet/deleteSet";
import { signInAs, signOutCookie } from "../../helpers/auth";
import { prisma } from "@/prisma/prismaClient";

beforeEach(async () => {
  await signInAs("alice");
});

async function makeSet() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { username: "alice" },
  });
  const session = await prisma.workoutSession.create({
    data: { userId: user.id },
  });
  return createSet({
    sessionId: session.id,
    exercise: "Deadlift",
    reps: 3,
    weight: 120,
  });
}

test("removes the row", async () => {
  const set = await makeSet();

  await deleteSet(set.id);

  expect(await prisma.workoutSet.findUnique({ where: { id: set.id } })).toBeNull();
});

test("unknown id throws", async () => {
  await expect(deleteSet(999999)).rejects.toThrow();
});

test("cannot delete another user's set", async () => {
  const set = await makeSet();
  signOutCookie();
  await signInAs("bob");

  await expect(deleteSet(set.id)).rejects.toThrow("Not found");
  expect(
    await prisma.workoutSet.findUnique({ where: { id: set.id } }),
  ).not.toBeNull();
});
