"use server";

import { requireUser } from "@/actions/auth/helpers";
import { requireAcceptedFriend } from "@/actions/friendship/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function getFriendSession(friendUserId: number, sessionId: number) {
  const user = await requireUser();
  await requireAcceptedFriend(user.id, friendUserId);
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: friendUserId },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
