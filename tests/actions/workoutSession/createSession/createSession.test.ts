import { expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { prisma } from "@/prisma/prismaClient";

test("persists and returns a session with generated id and createdAt", async () => {
  const session = await createSession({ name: "Push Day" });

  expect(session.id).toEqual(expect.any(Number));
  expect(session.createdAt).toBeInstanceOf(Date);
  expect(session.name).toBe("Push Day");

  const stored = await prisma.workoutSession.findUnique({
    where: { id: session.id },
  });
  expect(stored).toEqual(session);
});

test("trims name", async () => {
  const session = await createSession({ name: "  Leg Day  " });
  expect(session.name).toBe("Leg Day");
});

test("blank name becomes null and missing name is null", async () => {
  const blank = await createSession({ name: "   " });
  expect(blank.name).toBeNull();

  const missing = await createSession({});
  expect(missing.name).toBeNull();
});
