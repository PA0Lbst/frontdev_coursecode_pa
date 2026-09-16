"use server";

import { prisma } from "@/prisma/prismaClient";

export async function createSession(input: { name?: string | null }) {
  const trimmed = input.name?.trim();
  const name = !trimmed ? null : trimmed;
  return prisma.workoutSession.create({ data: { name } });
}
