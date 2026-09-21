"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function createSession(input: { name?: string | null }) {
  const user = await requireUser();
  const trimmed = input.name?.trim();
  const name = !trimmed ? null : trimmed;
  return prisma.workoutSession.create({ data: { name, userId: user.id } });
}
