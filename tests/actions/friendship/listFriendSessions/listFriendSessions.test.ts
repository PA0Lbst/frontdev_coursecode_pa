import { expect, test } from "vitest";
import { listFriendSessions } from "@/actions/friendship/listFriendSessions/listFriendSessions";
import { removeFriend } from "@/actions/friendship/removeFriend/removeFriend";
import { prisma } from "@/prisma/prismaClient";
import { createUsers, makeFriends, switchTo } from "../../helpers/auth";

test("returns a friend's sessions newest first with sets", async () => {
  const { alice, bob } = await makeFriends();
  const older = await prisma.workoutSession.create({
    data: { userId: bob.id, name: "Old", createdAt: new Date("2026-01-01") },
  });
  await prisma.workoutSession.create({
    data: { userId: bob.id, name: "New", createdAt: new Date("2026-02-01") },
  });
  await prisma.workoutSet.create({
    data: { sessionId: older.id, exercise: "Squat", reps: 5, weight: 100 },
  });
  await prisma.workoutSession.create({ data: { userId: alice.id, name: "Mine" } });

  const sessions = await listFriendSessions(bob.id);

  expect(sessions.map((s) => s.name)).toEqual(["New", "Old"]);
  expect(sessions[1].sets).toHaveLength(1);
});

test("refuses non-friends", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  await switchTo(alice.id);
  await expect(listFriendSessions(bob.id)).rejects.toThrow("Not found");
});

test("refuses pending friends", async () => {
  const [alice, bob] = await createUsers("alice", "bob");
  await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id },
  });
  await switchTo(alice.id);
  await expect(listFriendSessions(bob.id)).rejects.toThrow("Not found");
});

test("access disappears after removeFriend", async () => {
  const { bob, friendship } = await makeFriends();
  await expect(listFriendSessions(bob.id)).resolves.toEqual([]);
  await removeFriend(friendship.id);
  await expect(listFriendSessions(bob.id)).rejects.toThrow("Not found");
});
