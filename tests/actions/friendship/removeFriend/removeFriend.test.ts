import { expect, test } from "vitest";
import { removeFriend } from "@/actions/friendship/removeFriend/removeFriend";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, makeFriends, switchTo } from "../../helpers/auth";

test("the requester can remove a friend", async () => {
  const { friendship } = await makeFriends();
  await removeFriend(friendship.id);
  expect(await prisma.friendship.count()).toBe(0);
});

test("the addressee can remove a friend", async () => {
  const { bob, friendship } = await makeFriends();
  await switchTo(bob.id);
  await removeFriend(friendship.id);
  expect(await prisma.friendship.count()).toBe(0);
});

test("refuses pending requests", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  const row = await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  await switchTo(alice.id);
  await expect(removeFriend(row.id)).rejects.toThrow("Not found");
});

test("refuses users who are not part of the friendship", async () => {
  const { friendship } = await makeFriends();
  const [carol] = await createUsers("carol");
  await switchTo(carol.id);
  await expect(removeFriend(friendship.id)).rejects.toThrow("Not found");
  expect(await prisma.friendship.count()).toBe(1);
});
