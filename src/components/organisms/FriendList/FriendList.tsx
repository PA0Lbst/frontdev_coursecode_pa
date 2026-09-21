"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { type FriendshipEntry } from "@/data/friendship";

export type FriendListProps = {
  friends: FriendshipEntry[];
  onRemove: (id: number) => void | Promise<void>;
};

const FriendList = function FriendList({ friends, onRemove }: FriendListProps) {
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function handleRemove(id: number) {
    setPendingId(id);
    try {
      await onRemove(id);
    } catch {
      // The page shows the error alert; nothing local to reset.
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Friends</h2>
      {friends.length === 0 ? <p>No friends yet.</p> : null}
      <ul className="flex flex-col gap-2">
        {friends.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
          >
            <Link
              href={`/friends/${entry.user.username}`}
              className="flex min-h-11 min-w-0 flex-1 items-center truncate font-medium underline-offset-4 hover:underline"
            >
              {entry.user.username}
            </Link>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11"
              aria-label={`Remove ${entry.user.username}`}
              disabled={pendingId === entry.id}
              onClick={() => handleRemove(entry.id)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export { FriendList };
export default FriendList;
