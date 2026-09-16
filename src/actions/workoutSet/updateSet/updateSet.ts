"use server";

import { parseSetFields } from "@/actions/workoutSet/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function updateSet(input: {
  id: number;
  exercise: string;
  reps: number;
  weight: number;
}) {
  const data = parseSetFields(input);
  return prisma.workoutSet.update({
    where: { id: input.id },
    data,
  });
}
