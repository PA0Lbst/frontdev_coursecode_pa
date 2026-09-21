"use server";

import { requireUser } from "@/actions/auth/helpers";
import { parseSetFields } from "@/actions/workoutSet/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function updateSet(input: {
  id: number;
  exercise: string;
  reps: number;
  weight: number;
}) {
  const user = await requireUser();
  const data = parseSetFields(input);
  const owned = await prisma.workoutSet.findFirst({
    where: { id: input.id, session: { userId: user.id } },
  });
  if (!owned) {
    throw new Error("Not found");
  }
  return prisma.workoutSet.update({
    where: { id: input.id },
    data,
  });
}
