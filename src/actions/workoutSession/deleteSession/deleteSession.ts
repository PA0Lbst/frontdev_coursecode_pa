"use server";

import { prisma } from "@/prisma/prismaClient";

export async function deleteSession(id: number) {
  await prisma.workoutSession.delete({ where: { id } });
}
