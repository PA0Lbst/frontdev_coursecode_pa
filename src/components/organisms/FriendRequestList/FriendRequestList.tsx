"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { type FriendshipEntry } from "@/data/friendship";

export type FriendRequestListProps = {
  incoming: FriendshipEntry[];
  outgoing: FriendshipEntry[];
  onAccept: (id: number) => void | Promise<void>;
  onDecline: (id: number) => void | Promise<void>;
  onCancel: (id: number) => void | Promise<void>;
};

const FriendRequestList = function FriendRequestList({
  incoming,
  outgoing,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestListProps) {
  const [pending, setPending] = useState<string | null>(null);

  if (incoming.length === 0 && outgoing.length === 0) {
    return null;
  }

  async function run(
    key: string,
    callback: (id: number) => void | Promise<void>,
    id: number,
  ) {
    setPending(key);
    try {
      await callback(id);
    } catch {
      // The page shows the error alert; nothing local to reset.
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Requests</h2>
      <ul className="flex flex-col gap-2">
        {incoming.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {entry.user.username}
            </span>
            <Button
              size="sm"
              className="min-h-11"
              aria-label={`Accept ${entry.user.username}`}
              disabled={pending === `accept-${entry.id}`}
              onClick={() => run(`accept-${entry.id}`, onAccept, entry.id)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11"
              aria-label={`Decline ${entry.user.username}`}
              disabled={pending === `decline-${entry.id}`}
              onClick={() => run(`decline-${entry.id}`, onDecline, entry.id)}
            >
              Decline
            </Button>
          </li>
        ))}
        {outgoing.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {entry.user.username}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11"
              aria-label={`Cancel request to ${entry.user.username}`}
              disabled={pending === `cancel-${entry.id}`}
              onClick={() => run(`cancel-${entry.id}`, onCancel, entry.id)}
            >
              Cancel
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export { FriendRequestList };
export default FriendRequestList;
