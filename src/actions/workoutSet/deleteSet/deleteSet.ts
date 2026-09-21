"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function deleteSet(id: number) {
  const user = await requireUser();
  const owned = await prisma.workoutSet.findFirst({
    where: { id, session: { userId: user.id } },
  });
  if (!owned) {
    throw new Error("Not found");
  }
  await prisma.workoutSet.delete({ where: { id } });
}
