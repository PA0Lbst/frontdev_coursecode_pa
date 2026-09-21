import { expect, test } from "vitest";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, switchTo } from "../../helpers/auth";

test("splits friends, incoming and outgoing for each side", async () => {
  const [alice, bob, carol, dave] = await createUsers("alice", "bob", "carol", "dave");
  await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id, status: "accepted" },
  });
  await prisma.friendship.create({
    data: { requesterId: carol.id, addresseeId: alice.id },
  });
  await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: dave.id },
  });
  await prisma.friendship.create({
    data: { requesterId: bob.id, addresseeId: carol.id },
  });

  await switchTo(alice.id);
  const lists = await listFriendships();
  expect(lists.friends.map((e) => e.user.username)).toEqual(["bob"]);
  expect(lists.incoming.map((e) => e.user.username)).toEqual(["carol"]);
  expect(lists.outgoing.map((e) => e.user.username)).toEqual(["dave"]);

  await switchTo(bob.id);
  const bobLists = await listFriendships();
  expect(bobLists.friends.map((e) => e.user.username)).toEqual(["alice"]);
  expect(bobLists.outgoing.map((e) => e.user.username)).toEqual(["carol"]);
  expect(bobLists.incoming).toEqual([]);
});
