"use server";

import { requireUser } from "@/actions/auth/helpers";
import { requireAcceptedFriend } from "@/actions/friendship/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function listFriendSessions(friendUserId: number) {
  const user = await requireUser();
  await requireAcceptedFriend(user.id, friendUserId);
  return prisma.workoutSession.findMany({
    where: { userId: friendUserId },
    orderBy: { createdAt: "desc" },
    include: { sets: { orderBy: { createdAt: "asc" } } },
  });
}
