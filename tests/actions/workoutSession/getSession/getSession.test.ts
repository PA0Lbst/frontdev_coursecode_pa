import { beforeEach, expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { getSession } from "@/actions/workoutSession/getSession/getSession";
import { createSet } from "@/actions/workoutSet/createSet/createSet";

import { signInAs, signOutCookie } from "../../helpers/auth";

beforeEach(async () => {
  await signInAs("alice");
});

test("returns the session with its sets", async () => {
  const session = await createSession({ name: "Push day" });
  await createSet({
    sessionId: session.id,
    exercise: "Bench Press",
    reps: 5,
    weight: 60,
  });

  const found = await getSession(session.id);

  expect(found?.name).toBe("Push day");
  expect(found?.sets.map((set) => set.exercise)).toEqual(["Bench Press"]);
});

test("returns null for an unknown id", async () => {
  expect(await getSession(999999)).toBeNull();
});

test("returns null for another user's session", async () => {
  const session = await createSession({ name: "Alice's" });
  signOutCookie();
  await signInAs("bob");

  expect(await getSession(session.id)).toBeNull();
});
