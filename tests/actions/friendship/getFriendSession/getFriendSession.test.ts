import { expect, test } from "vitest";
import { getFriendSession } from "@/actions/friendship/getFriendSession/getFriendSession";
import { removeFriend } from "@/actions/friendship/removeFriend/removeFriend";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, makeFriends, switchTo } from "../../helpers/auth";

test("returns the friend's session with sets ascending", async () => {
  const { bob } = await makeFriends();
  const session = await prisma.workoutSession.create({
    data: { userId: bob.id, name: "Push" },
  });
  await prisma.workoutSet.create({
    data: { sessionId: session.id, exercise: "A", reps: 1, weight: 1, createdAt: new Date("2026-01-01") },
  });
  await prisma.workoutSet.create({
    data: { sessionId: session.id, exercise: "B", reps: 1, weight: 1, createdAt: new Date("2026-01-02") },
  });

  const found = await getFriendSession(bob.id, session.id);

  expect(found?.name).toBe("Push");
  expect(found?.sets.map((s) => s.exercise)).toEqual(["A", "B"]);
});

test("returns null for an unknown session or one owned by someone else", async () => {
  const { alice, bob } = await makeFriends();
  const mine = await prisma.workoutSession.create({ data: { userId: alice.id } });
  expect(await getFriendSession(bob.id, mine.id)).toBeNull();
  expect(await getFriendSession(bob.id, 999999)).toBeNull();
});

test("refuses non-friends and pending friends", async () => {
  const [alice, bob, carol] = await createUsers("alice", "bob", "carol");
  const session = await prisma.workoutSession.create({ data: { userId: bob.id } });
  await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  await switchTo(alice.id);
  await expect(getFriendSession(bob.id, session.id)).rejects.toThrow("Not found");
  await switchTo(carol.id);
  await expect(getFriendSession(bob.id, session.id)).rejects.toThrow("Not found");
});

test("access disappears after removeFriend", async () => {
  const { bob, friendship } = await makeFriends();
  const session = await prisma.workoutSession.create({ data: { userId: bob.id } });
  expect(await getFriendSession(bob.id, session.id)).not.toBeNull();
  await removeFriend(friendship.id);
  await expect(getFriendSession(bob.id, session.id)).rejects.toThrow("Not found");
});
