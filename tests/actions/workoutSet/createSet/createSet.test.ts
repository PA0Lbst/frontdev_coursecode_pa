import { expect, test } from "vitest";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { prisma } from "@/prisma/prismaClient";

async function makeSession() {
  return prisma.workoutSession.create({ data: {} });
}

test("persists and returns a set with generated id and createdAt", async () => {
  const session = await makeSession();

  const set = await createSet({
    sessionId: session.id,
    exercise: "Bench Press",
    reps: 5,
    weight: 60,
  });

  expect(set.id).toEqual(expect.any(Number));
  expect(set.createdAt).toBeInstanceOf(Date);
  expect(set.sessionId).toBe(session.id);
  expect(set.exercise).toBe("Bench Press");
  expect(set.reps).toBe(5);
  expect(set.weight).toBe(60);

  const stored = await prisma.workoutSet.findUnique({ where: { id: set.id } });
  expect(stored).toEqual(set);
});

test("trims exercise", async () => {
  const session = await makeSession();

  const set = await createSet({
    sessionId: session.id,
    exercise: "  Squat  ",
    reps: 5,
    weight: 100,
  });

  expect(set.exercise).toBe("Squat");
});

test("rejects empty exercise, non-positive reps, and negative weight without writing a row", async () => {
  const session = await makeSession();

  await expect(
    createSet({ sessionId: session.id, exercise: "", reps: 5, weight: 60 }),
  ).rejects.toThrow();
  await expect(
    createSet({
      sessionId: session.id,
      exercise: "   ",
      reps: 5,
      weight: 60,
    }),
  ).rejects.toThrow();
  await expect(
    createSet({
      sessionId: session.id,
      exercise: "Squat",
      reps: 0,
      weight: 60,
    }),
  ).rejects.toThrow();
  await expect(
    createSet({
      sessionId: session.id,
      exercise: "Squat",
      reps: 1.5,
      weight: 60,
    }),
  ).rejects.toThrow();
  await expect(
    createSet({
      sessionId: session.id,
      exercise: "Squat",
      reps: 5,
      weight: -1,
    }),
  ).rejects.toThrow();

  expect(await prisma.workoutSet.count()).toBe(0);
});

test("rejects an unknown sessionId", async () => {
  await expect(
    createSet({ sessionId: 999999, exercise: "Squat", reps: 5, weight: 60 }),
  ).rejects.toThrow();

  expect(await prisma.workoutSet.count()).toBe(0);
});
