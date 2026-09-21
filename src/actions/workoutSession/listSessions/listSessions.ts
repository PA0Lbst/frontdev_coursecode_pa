"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function listSessions() {
  const user = await requireUser();
  return prisma.workoutSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
