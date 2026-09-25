"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { FriendList } from "@/components/organisms/FriendList/FriendList";
import { FriendRequestList } from "@/components/organisms/FriendRequestList/FriendRequestList";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import {
  type FriendshipEntry,
  type FriendshipLists,
  type SendFriendRequestResult,
} from "@/data/friendship";

export type FriendsPageProps = {
  username?: string;
  signOut?: () => Promise<void>;
  initialFriendships: FriendshipLists;
  sendFriendRequest: (username: string) => Promise<SendFriendRequestResult>;
  acceptFriendRequest: (id: number) => Promise<FriendshipEntry>;
  declineFriendRequest: (id: number) => Promise<void>;
  cancelFriendRequest: (id: number) => Promise<void>;
  removeFriend: (id: number) => Promise<void>;
};

const GENERIC_ERROR = "Something went wrong. Try again.";

const FriendsPage = function FriendsPage({
  username,
  signOut,
  initialFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
}: FriendsPageProps) {
  const [friends, setFriends] = useState(initialFriendships.friends);
  const [incoming, setIncoming] = useState(initialFriendships.incoming);
  const [outgoing, setOutgoing] = useState(initialFriendships.outgoing);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setSending(true);
    try {
      const result = await sendFriendRequest(name);
      if ("error" in result) {
        setErrorMessage(result.error);
        return;
      }
      if (result.status === "accepted") {
        setIncoming((current) =>
          current.filter((item) => item.id !== result.entry.id),
        );
        setFriends((current) => [result.entry, ...current]);
      } else {
        setOutgoing((current) => [result.entry, ...current]);
      }
      setName("");
      setErrorMessage(null);
    } catch {
      setErrorMessage(GENERIC_ERROR);
    } finally {
      setSending(false);
    }
  }

  // Runs a mutation, shows the generic alert on failure, and rethrows for the child.
  async function mutate(action: () => Promise<void>) {
    try {
      await action();
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(GENERIC_ERROR);
      throw error;
    }
  }

  const onAccept = (id: number) =>
    mutate(async () => {
      const entry = await acceptFriendRequest(id);
      setIncoming((current) => current.filter((item) => item.id !== id));
      setFriends((current) => [entry, ...current]);
    });

  const onDecline = (id: number) =>
    mutate(async () => {
      await declineFriendRequest(id);
      setIncoming((current) => current.filter((item) => item.id !== id));
    });

  const onCancel = (id: number) =>
    mutate(async () => {
      await cancelFriendRequest(id);
      setOutgoing((current) => current.filter((item) => item.id !== id));
    });

  const onRemove = (id: number) =>
    mutate(async () => {
      await removeFriend(id);
      setFriends((current) => current.filter((item) => item.id !== id));
    });

  return (
    <PageTemplate
      username={username}
      onSignOut={signOut}
      pendingRequestCount={incoming.length}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {errorMessage ? (
          <p className="text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="friends-username">
              Username
            </label>
            <Input
              id="friends-username"
              className="min-h-11 text-base"
              autoComplete="off"
              autoCapitalize="none"
              enterKeyHint="send"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            disabled={sending}
          >
            Send request
          </Button>
        </form>
        <FriendRequestList
          incoming={incoming}
          outgoing={outgoing}
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={onCancel}
        />
        <FriendList friends={friends} onRemove={onRemove} />
      </div>
    </PageTemplate>
  );
};

export { FriendsPage };
export default FriendsPage;
