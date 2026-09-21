"use server";

import { requireUser } from "@/actions/auth/helpers";
import { toEntry } from "@/actions/friendship/helpers";
import type { FriendshipLists } from "@/data/friendship";
import { prisma } from "@/prisma/prismaClient";

export async function listFriendships(): Promise<FriendshipLists> {
  const user = await requireUser();
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { requester: true, addressee: true },
  });
  const lists: FriendshipLists = { friends: [], incoming: [], outgoing: [] };
  for (const row of rows) {
    const entry = toEntry(row, user.id);
    if (row.status === "accepted") {
      lists.friends.push(entry);
    } else if (row.addresseeId === user.id) {
      lists.incoming.push(entry);
    } else {
      lists.outgoing.push(entry);
    }
  }
  return lists;
}
