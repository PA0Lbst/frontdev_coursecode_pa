/*
 * Next.js App Router route for `/friends/[username]`.
 * Read-only list of an accepted friend's workouts.
 */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { signOut } from "@/actions/auth/signOut/signOut";
import { listFriendSessions } from "@/actions/friendship/listFriendSessions/listFriendSessions";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { FriendWorkoutsPage } from "@/components/pages/FriendWorkoutsPage/FriendWorkoutsPage";

export const dynamic = "force-dynamic";

export default async function FriendWorkoutsRoute({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const friendUsername = (await params).username.toLowerCase();
  const lists = await listFriendships();
  const friend = lists.friends.find(
    (entry) => entry.user.username === friendUsername,
  );
  if (!friend) {
    notFound();
  }
  const sessions = await listFriendSessions(friend.user.id);
  const rows = sessions.map(({ sets, ...session }) => ({
    ...session,
    setCount: sets.length,
  }));

  return (
    <FriendWorkoutsPage
      username={user.username}
      signOut={signOut}
      pendingRequestCount={lists.incoming.length}
      friendUsername={friend.user.username}
      sessions={rows}
    />
  );
}
