"use server";

import { prisma } from "@/prisma/prismaClient";

export async function listSessions() {
  return prisma.workoutSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
