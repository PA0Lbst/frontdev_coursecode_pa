/*
 * Next.js App Router route for `/friends`.
 * Loads the caller's friendships and injects the friendship actions.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { signOut } from "@/actions/auth/signOut/signOut";
import { acceptFriendRequest } from "@/actions/friendship/acceptFriendRequest/acceptFriendRequest";
import { cancelFriendRequest } from "@/actions/friendship/cancelFriendRequest/cancelFriendRequest";
import { declineFriendRequest } from "@/actions/friendship/declineFriendRequest/declineFriendRequest";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { removeFriend } from "@/actions/friendship/removeFriend/removeFriend";
import { sendFriendRequest } from "@/actions/friendship/sendFriendRequest/sendFriendRequest";
import { FriendsPage } from "@/components/pages/FriendsPage/FriendsPage";

export const dynamic = "force-dynamic";

export default async function FriendsRoute() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return (
    <FriendsPage
      username={user.username}
      signOut={signOut}
      initialFriendships={await listFriendships()}
      sendFriendRequest={sendFriendRequest}
      acceptFriendRequest={acceptFriendRequest}
      declineFriendRequest={declineFriendRequest}
      cancelFriendRequest={cancelFriendRequest}
      removeFriend={removeFriend}
    />
  );
}
