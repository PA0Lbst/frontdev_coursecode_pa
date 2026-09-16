"use server";

import { prisma } from "@/prisma/prismaClient";

export async function deleteSet(id: number) {
  await prisma.workoutSet.delete({ where: { id } });
}
