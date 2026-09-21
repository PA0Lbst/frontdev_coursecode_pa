/*
 * Next.js App Router route for `/`.
 * Loads the workout list and injects Server Actions into the page component.
 *
 * This is the root page of the application.
 */

// server side, DB code and actions
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { signOut } from "@/actions/auth/signOut/signOut";
import { createSession } from "@/actions/workoutSession/createSession/createSession";
import { deleteSession } from "@/actions/workoutSession/deleteSession/deleteSession";
import { listSessions } from "@/actions/workoutSession/listSessions/listSessions";

// the main client component
import { WorkoutListPage } from "@/components/pages/WorkoutListPage/WorkoutListPage";

// Render this route on every request so listSessions() always returns current DB rows.
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const sessions = await listSessions();
  // The list only needs the session rows, not their sets.
  const rows = sessions.map(({ sets, ...session }) => ({
    ...session,
    setCount: sets.length,
  }));

  return (
    <WorkoutListPage
      username={user.username}
      signOut={signOut}
      initialSessions={rows}
      createSession={createSession}
      deleteSession={deleteSession}
    />
  );
}
