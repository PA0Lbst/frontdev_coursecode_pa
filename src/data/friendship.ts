export type FriendUser = { id: number; username: string };

// `user` is the other person in the friendship, never the viewer.
export type FriendshipEntry = { id: number; user: FriendUser };

export type FriendshipLists = {
  friends: FriendshipEntry[];
  incoming: FriendshipEntry[];
  outgoing: FriendshipEntry[];
};

export const FRIEND_ERRORS = [
  "User not found",
  "Already requested",
  "Already friends",
] as const;

export type FriendError = (typeof FRIEND_ERRORS)[number];

export type SendFriendRequestResult =
  | { entry: FriendshipEntry; status: "pending" | "accepted" }
  | { error: FriendError };
