"use server";

import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function declineFriendRequest(id: number): Promise<void> {
  const user = await requireUser();
  const { count } = await prisma.friendship.deleteMany({
    where: { id, addresseeId: user.id, status: "pending" },
  });
  if (count === 0) {
    throw new Error("Not found");
  }
}
