"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function deleteSession(id: number) {
  const user = await requireUser();
  const session = await prisma.workoutSession.findFirst({
    where: { id, userId: user.id },
  });
  if (!session) {
    throw new Error("Not found");
  }
  await prisma.workoutSession.delete({ where: { id } });
}
