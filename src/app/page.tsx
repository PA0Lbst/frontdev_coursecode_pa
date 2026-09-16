/*
 * Next.js App Router route for `/`.
 * Loads the current workout session and injects Server Actions into the page component.
 *
 * This is the root page of the application.
 */

// server side, DB code and actions
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { listSessions } from "@/actions/workoutSession/listSessions/listSessions";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSet } from "@/actions/workoutSet/deleteSet/deleteSet";
import { updateSet } from "@/actions/workoutSet/updateSet/updateSet";

// the main client component
import { WorkoutPage } from "@/components/pages/WorkoutPage/WorkoutPage";

// Render this route on every request so listSessions() always returns current DB rows.
export const dynamic = "force-dynamic";

export default async function Home() {
  const sessions = await listSessions();
  const currentSession = sessions[0] ?? (await createSession({}));
  const initialSets = sessions[0]?.sets ?? [];

  // Bound Server Action: closes over the current session id so the client
  // component never needs to know about sessions at all.
  async function addSet(input: {
    exercise: string;
    reps: number;
    weight: number;
  }) {
    "use server";
    return createSet({ sessionId: currentSession.id, ...input });
  }

  // main client component with server side actions passed as props
  return (
    <WorkoutPage
      initialSets={initialSets}
      createSet={addSet}
      updateSet={updateSet}
      deleteSet={deleteSet}
    />
  );
}
