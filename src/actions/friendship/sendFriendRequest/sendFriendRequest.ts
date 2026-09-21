"use server";

import { requireUser } from "@/actions/auth/helpers";
import { findFriendshipBetween, toEntry } from "@/actions/friendship/helpers";
import type { SendFriendRequestResult } from "@/data/friendship";
import { normalizeUsername } from "@/data/username";
import { prisma } from "@/prisma/prismaClient";

const include = { requester: true, addressee: true } as const;

export async function sendFriendRequest(
  username: string,
): Promise<SendFriendRequestResult> {
  const user = await requireUser();
  const target = await prisma.user.findUnique({
    where: { username: normalizeUsername(username) },
  });
  if (!target) {
    return { error: "User not found" };
  }
  if (target.id === user.id) {
    throw new Error("Cannot befriend yourself");
  }

  const existing = await findFriendshipBetween(user.id, target.id);
  if (existing) {
    if (existing.status === "accepted") {
      return { error: "Already friends" };
    }
    if (existing.requesterId === user.id) {
      return { error: "Already requested" };
    }
    const accepted = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "accepted" },
      include,
    });
    return { entry: toEntry(accepted, user.id), status: "accepted" };
  }

  try {
    const created = await prisma.friendship.create({
      data: { requesterId: user.id, addresseeId: target.id },
      include,
    });
    return { entry: toEntry(created, user.id), status: "pending" };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { error: "Already requested" };
    }
    throw error;
  }
}
