import { expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSession } from "@/actions/workoutSession/deleteSession/deleteSession";
import { prisma } from "@/prisma/prismaClient";

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
  await expect(deleteSession(999999)).rejects.toThrow();
});
