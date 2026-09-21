"use server";

import { requireUser } from "@/actions/auth/helpers";
import { toEntry } from "@/actions/friendship/helpers";
import type { FriendshipEntry } from "@/data/friendship";
import { prisma } from "@/prisma/prismaClient";

export async function acceptFriendRequest(id: number): Promise<FriendshipEntry> {
  const user = await requireUser();
  const request = await prisma.friendship.findFirst({
    where: { id, addresseeId: user.id, status: "pending" },
  });
  if (!request) {
    throw new Error("Not found");
  }
  const accepted = await prisma.friendship.update({
    where: { id },
    data: { status: "accepted" },
    include: { requester: true, addressee: true },
  });
  return toEntry(accepted, user.id);
}
