/*
 * Next.js App Router route for `/account`.
 * Lists the signed-in user's passkeys and injects the passkey actions.
 */
import { redirect } from "next/navigation";
import { listFriendships } from "@/actions/friendship/listFriendships/listFriendships";
import { finishAddPasskey } from "@/actions/auth/finishAddPasskey/finishAddPasskey";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { listPasskeys } from "@/actions/auth/listPasskeys/listPasskeys";
import { removePasskey } from "@/actions/auth/removePasskey/removePasskey";
import { signOut } from "@/actions/auth/signOut/signOut";
import { startAddPasskey } from "@/actions/auth/startAddPasskey/startAddPasskey";
import { AccountPage } from "@/components/pages/AccountPage/AccountPage";

export const dynamic = "force-dynamic";

export default async function AccountRoute() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const { incoming } = await listFriendships();
  return (
    <AccountPage
      username={user.username}
      pendingRequestCount={incoming.length}
      initialPasskeys={await listPasskeys()}
      startAddPasskey={startAddPasskey}
      finishAddPasskey={finishAddPasskey}
      removePasskey={removePasskey}
      signOut={signOut}
    />
  );
}
