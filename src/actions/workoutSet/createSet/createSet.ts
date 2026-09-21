"use server";

import { requireUser } from "@/actions/auth/helpers";
import { parseSetFields } from "@/actions/workoutSet/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function createSet(input: {
  sessionId: number;
  exercise: string;
  reps: number;
  weight: number;
}) {
  const user = await requireUser();
  const data = parseSetFields(input);
  const session = await prisma.workoutSession.findFirst({
    where: { id: input.sessionId, userId: user.id },
  });
  if (!session) {
    throw new Error("Not found");
  }
  return prisma.workoutSet.create({
    data: { ...data, sessionId: input.sessionId },
  });
}
