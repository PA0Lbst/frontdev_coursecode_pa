"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function listPasskeys() {
  const user = await requireUser();
  return prisma.passkey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true, createdAt: true },
  });
}
