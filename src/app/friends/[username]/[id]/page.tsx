/*
 * Next.js App Router route for `/friends/[username]/[id]`.
 * Read-only detail of one workout that belongs to an accepted friend.
 */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { signOut } from "@/actions/auth/signOut/signOut";
import { getFriendSession } from "@/actions/friendship/getFriendSession/getFriendSession";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { ReadOnlyWorkoutPage } from "@/components/pages/ReadOnlyWorkoutPage/ReadOnlyWorkoutPage";
import { workoutLabel } from "@/data/workoutLabel";

export const dynamic = "force-dynamic";

export default async function FriendWorkoutRoute({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const { username, id } = await params;
  const sessionId = Number(id);
  if (!Number.isInteger(sessionId)) {
    notFound();
  }
  const lists = await listFriendships();
  const friend = lists.friends.find(
    (entry) => entry.user.username === username.toLowerCase(),
  );
  if (!friend) {
    notFound();
  }
  const session = await getFriendSession(friend.user.id, sessionId);
  if (!session) {
    notFound();
  }

  return (
    <ReadOnlyWorkoutPage
      username={user.username}
      signOut={signOut}
      pendingRequestCount={lists.incoming.length}
      title={workoutLabel(session)}
      sets={session.sets}
      backHref={`/friends/${friend.user.username}`}
      backLabel={`Back to ${friend.user.username}'s workouts`}
    />
  );
}
