import { expect, test } from "vitest";
import { cancelFriendRequest } from "@/actions/friendship/cancelFriendRequest/cancelFriendRequest";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, switchTo } from "../../helpers/auth";

async function pending() {
  const [alice, bob] = await createUsers("alice", "bob");
  const row = await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  return { alice, bob, row };
}

test("the requester cancels and the row is deleted", async () => {
  const { alice, row } = await pending();
  await switchTo(alice.id);
  await cancelFriendRequest(row.id);
  expect(await prisma.friendship.count()).toBe(0);
});

test("the addressee cannot cancel", async () => {
  const { bob, row } = await pending();
  await switchTo(bob.id);
  await expect(cancelFriendRequest(row.id)).rejects.toThrow("Not found");
  expect(await prisma.friendship.count()).toBe(1);
});

test("cannot cancel an accepted friendship", async () => {
  const { alice, row } = await pending();
  await prisma.friendship.update({ where: { id: row.id }, data: { status: "accepted" } });
  await switchTo(alice.id);
  await expect(cancelFriendRequest(row.id)).rejects.toThrow("Not found");
});
