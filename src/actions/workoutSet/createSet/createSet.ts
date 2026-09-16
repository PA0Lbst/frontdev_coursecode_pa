"use server";

import { parseSetFields } from "@/actions/workoutSet/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function createSet(input: {
  sessionId: number;
  exercise: string;
  reps: number;
  weight: number;
}) {
  const data = parseSetFields(input);
  const session = await prisma.workoutSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) {
    throw new Error("Session not found");
  }
  return prisma.workoutSet.create({
    data: { ...data, sessionId: input.sessionId },
  });
}
