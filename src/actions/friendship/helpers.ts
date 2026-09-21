import type { FriendshipEntry } from "@/data/friendship";
import { prisma } from "@/prisma/prismaClient";

export function findFriendshipBetween(a: number, b: number) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

export async function requireAcceptedFriend(userId: number, friendUserId: number) {
  const friendship = await findFriendshipBetween(userId, friendUserId);
  if (!friendship || friendship.status !== "accepted") {
    throw new Error("Not found");
  }
  return friendship;
}

export function toEntry(
  row: {
    id: number;
    requesterId: number;
    requester: { id: number; username: string };
    addressee: { id: number; username: string };
  },
  viewerId: number,
): FriendshipEntry {
  const other = row.requesterId === viewerId ? row.addressee : row.requester;
  return { id: row.id, user: { id: other.id, username: other.username } };
}
