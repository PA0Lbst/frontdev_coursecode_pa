import { expect, test } from "vitest";
import { sendFriendRequest } from "@/actions/friendship/sendFriendRequest/sendFriendRequest";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, signOutCookie, switchTo } from "../../helpers/auth";

test("creates a pending request (username is case-insensitive)", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  await switchTo(alice.id);

  const result = await sendFriendRequest("  BOB ");

  expect(result).toEqual({
    entry: { id: expect.any(Number), user: { id: bob.id, username: "bob" } },
    status: "pending",
  });
  const rows = await prisma.friendship.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    requesterId: alice.id,
    addresseeId: bob.id,
    status: "pending",
  });
});

test("unknown user returns an error", async () => {
  const [alice] = await createUsers("alice");
  await switchTo(alice.id);
  expect(await sendFriendRequest("nobody")).toEqual({ error: "User not found" });
});

test("duplicate request returns Already requested", async () => {
  const [alice] = await createUsers("alice", "bob");
  await switchTo(alice.id);
  await sendFriendRequest("bob");
  expect(await sendFriendRequest("bob")).toEqual({ error: "Already requested" });
  expect(await prisma.friendship.count()).toBe(1);
});

test("existing friendship returns Already friends from either side", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id, status: "accepted" },
  });
  await switchTo(bob.id);
  expect(await sendFriendRequest("alice")).toEqual({ error: "Already friends" });
});

test("cannot befriend yourself", async () => {
  const [alice] = await createUsers("alice");
  await switchTo(alice.id);
  await expect(sendFriendRequest("alice")).rejects.toThrow();
  expect(await prisma.friendship.count()).toBe(0);
});

test("a request to someone who already asked accepts it", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  await switchTo(alice.id);
  await sendFriendRequest("bob");
  await switchTo(bob.id);

  const result = await sendFriendRequest("alice");

  expect(result).toMatchObject({ status: "accepted" });
  const rows = await prisma.friendship.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("accepted");
});

test("throws Unauthorized when signed out", async () => {
  await createUsers("bob");
  signOutCookie();
  await expect(sendFriendRequest("bob")).rejects.toThrow("Unauthorized");
});
