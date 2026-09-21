import { beforeEach, expect, test } from "vitest";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { updateSet } from "@/actions/workoutSet/updateSet/updateSet";
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
    exercise: "Bench Press",
    reps: 5,
    weight: 60,
  });
}

test("updates exercise/reps/weight and returns the saved set", async () => {
  const set = await makeSet();

  const updated = await updateSet({
    id: set.id,
    exercise: "Incline Bench Press",
    reps: 8,
    weight: 50,
  });

  expect(updated.id).toBe(set.id);
  expect(updated.sessionId).toBe(set.sessionId);
  expect(updated.createdAt).toEqual(set.createdAt);
  expect(updated.exercise).toBe("Incline Bench Press");
  expect(updated.reps).toBe(8);
  expect(updated.weight).toBe(50);
});

test("unknown id throws", async () => {
  await expect(
    updateSet({ id: 999999, exercise: "Squat", reps: 5, weight: 60 }),
  ).rejects.toThrow();
});

test("cannot update another user's set", async () => {
  const set = await makeSet();
  signOutCookie();
  await signInAs("bob");

  await expect(
    updateSet({ id: set.id, exercise: "Hacked", reps: 1, weight: 1 }),
  ).rejects.toThrow("Not found");
  const stored = await prisma.workoutSet.findUnique({ where: { id: set.id } });
  expect(stored?.exercise).toBe("Bench Press");
});
