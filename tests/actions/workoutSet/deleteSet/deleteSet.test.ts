import { expect, test } from "vitest";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSet } from "@/actions/workoutSet/deleteSet/deleteSet";
import { prisma } from "@/prisma/prismaClient";

test("removes the row", async () => {
  const session = await prisma.workoutSession.create({ data: {} });
  const set = await createSet({
    sessionId: session.id,
    exercise: "Deadlift",
    reps: 3,
    weight: 120,
  });

  await deleteSet(set.id);

  expect(await prisma.workoutSet.findUnique({ where: { id: set.id } })).toBeNull();
});

test("unknown id throws", async () => {
  await expect(deleteSet(999999)).rejects.toThrow();
});
