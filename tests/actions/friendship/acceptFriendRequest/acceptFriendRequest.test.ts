import { expect, test } from "vitest";
import { acceptFriendRequest } from "@/actions/friendship/acceptFriendRequest/acceptFriendRequest";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, switchTo } from "../../helpers/auth";

async function pending() {
  const [alice, bob] = await createUsers("alice", "bob");
  const row = await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  return { alice, bob, row };
}

test("the addressee accepts and gets the requester back", async () => {
  const { alice, bob, row } = await pending();
  await switchTo(bob.id);

  const entry = await acceptFriendRequest(row.id);

  expect(entry).toEqual({ id: row.id, user: { id: alice.id, username: "alice" } });
  expect((await prisma.friendship.findUnique({ where: { id: row.id } }))?.status).toBe("accepted");
});

test("the requester cannot accept their own request", async () => {
  const { alice, row } = await pending();
  await switchTo(alice.id);
  await expect(acceptFriendRequest(row.id)).rejects.toThrow("Not found");
});

test("an already accepted or unknown request is Not found", async () => {
  const { bob, row } = await pending();
  await switchTo(bob.id);
  await acceptFriendRequest(row.id);
  await expect(acceptFriendRequest(row.id)).rejects.toThrow("Not found");
  await expect(acceptFriendRequest(999999)).rejects.toThrow("Not found");
});
