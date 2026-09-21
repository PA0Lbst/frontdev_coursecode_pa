"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function removeFriend(id: number): Promise<void> {
  const user = await requireUser();
  const { count } = await prisma.friendship.deleteMany({
    where: {
      id,
      status: "accepted",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
  });
  if (count === 0) {
    throw new Error("Not found");
  }
}
