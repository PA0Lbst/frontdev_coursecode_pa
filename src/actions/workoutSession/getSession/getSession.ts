"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function getSession(id: number) {
  const user = await requireUser();
  return prisma.workoutSession.findFirst({
    where: { id, userId: user.id },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
