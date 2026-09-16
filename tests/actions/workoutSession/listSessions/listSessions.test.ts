import { expect, test } from "vitest";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { listSessions } from "@/actions/workoutSession/listSessions/listSessions";

// SQLite's CURRENT_TIMESTAMP (used for the createdAt default) has second
// resolution, so ordering assertions need a real gap between writes.
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("returns sessions newest-first, each with sets ordered oldest-first", async () => {
  const first = await createSession({ name: "First" });
  await wait(1100);
  const second = await createSession({ name: "Second" });

  await createSet({
    sessionId: second.id,
    exercise: "Squat",
    reps: 5,
    weight: 100,
  });
  await wait(1100);
  await createSet({
    sessionId: second.id,
    exercise: "Bench Press",
    reps: 5,
    weight: 60,
  });

  const sessions = await listSessions();

  expect(sessions.map((session) => session.id)).toEqual([
    second.id,
    first.id,
  ]);
  expect(sessions[1].sets).toEqual([]);
  expect(sessions[0].sets.map((set) => set.exercise)).toEqual([
    "Squat",
    "Bench Press",
  ]);
}, 10000);
