/*
 * Next.js App Router route for `/workouts/[id]`.
 * Loads one workout and injects Server Actions into the page component.
 */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { signOut } from "@/actions/auth/signOut/signOut";
import { getSession } from "@/actions/workoutSession/getSession/getSession";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { createSet } from "@/actions/workoutSet/createSet/createSet";
import { deleteSet } from "@/actions/workoutSet/deleteSet/deleteSet";
import { updateSet } from "@/actions/workoutSet/updateSet/updateSet";
import { WorkoutPage } from "@/components/pages/WorkoutPage/WorkoutPage";
import { workoutLabel } from "@/data/workoutLabel";

export const dynamic = "force-dynamic";

export default async function WorkoutRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const sessionId = Number((await params).id);
  if (!Number.isInteger(sessionId)) {
    notFound();
  }
  const session = await getSession(sessionId);
  const { incoming } = await listFriendships();
  if (!session) {
    notFound();
  }

  // Bound Server Action: the client component never needs to know the session id.
  async function addSet(input: {
    exercise: string;
    reps: number;
    weight: number;
  }) {
    "use server";
    return createSet({ sessionId, ...input });
  }

  return (
    <WorkoutPage
      username={user.username}
      pendingRequestCount={incoming.length}
      signOut={signOut}
      title={workoutLabel(session)}
      initialSets={session.sets}
      createSet={addSet}
      updateSet={updateSet}
      deleteSet={deleteSet}
    />
  );
}
