"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function cancelFriendRequest(id: number): Promise<void> {
  const user = await requireUser();
  const { count } = await prisma.friendship.deleteMany({
    where: { id, requesterId: user.id, status: "pending" },
  });
  if (count === 0) {
    throw new Error("Not found");
  }
}
