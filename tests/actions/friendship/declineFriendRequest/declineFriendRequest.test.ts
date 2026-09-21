import { expect, test } from "vitest";
import { declineFriendRequest } from "@/actions/friendship/declineFriendRequest/declineFriendRequest";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, switchTo } from "../../helpers/auth";

async function pending() {
  const [alice, bob] = await createUsers("alice", "bob");
  const row = await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  return { alice, bob, row };
}

test("the addressee declines and the row is deleted", async () => {
  const { bob, row } = await pending();
  await switchTo(bob.id);
  await declineFriendRequest(row.id);
  expect(await prisma.friendship.count()).toBe(0);
});

test("the requester cannot decline", async () => {
  const { alice, row } = await pending();
  await switchTo(alice.id);
  await expect(declineFriendRequest(row.id)).rejects.toThrow("Not found");
  expect(await prisma.friendship.count()).toBe(1);
});

test("cannot decline an accepted friendship", async () => {
  const { bob, row } = await pending();
  await prisma.friendship.update({ where: { id: row.id }, data: { status: "accepted" } });
  await switchTo(bob.id);
  await expect(declineFriendRequest(row.id)).rejects.toThrow("Not found");
});
