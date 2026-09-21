# Friends and Shared Workouts

## Context

- Depends on spec 015: every `WorkoutSession` has a `userId`, users sign in with passkeys, and `getCurrentUser()` exists.
- Actions follow `src/actions/{resource}/{actionName}/`, no Route Handlers, client state applied locally (no refetch, no `router.refresh`).
- Usernames are unique and public (spec 015).

## Goals

Users can add friends by username and browse their friends' workouts, read-only, in a Friends tab.

## Requirements

### Sharing model

- A user's workouts are visible to **accepted friends only**, read-only (sessions and their sets). There is no per-workout privacy toggle and no public link.
- Friends can never create, edit or delete anything in someone else's workouts.
- Removing a friend, or declining a request, revokes access immediately.

### Data model

- `Friendship`: `id`, `requesterId` → `User`, `addresseeId` → `User` (both cascade), `status` (`pending | accepted`), `createdAt`.
- Unique on the unordered pair: at most one row per two users. Enforce in the action (check both directions) and with a unique index on `(requesterId, addresseeId)`.
- Cannot befriend yourself.
- Declining, cancelling or removing deletes the row (no `declined` state, no blocking).

### Actions (each its own folder under `src/actions/friendship/`)

- `sendFriendRequest(username)`: finds the user by lowercased username. Unknown user → `User not found`. Existing pending/accepted row in either direction → `Already requested` / `Already friends`. If the other person already has a pending request to the caller, accept it instead (single step).
- `acceptFriendRequest(id)`: only the addressee, only when `pending`.
- `declineFriendRequest(id)`: only the addressee; deletes the row.
- `cancelFriendRequest(id)`: only the requester, only when `pending`.
- `removeFriend(id)`: either party, only when `accepted`.
- `listFriendships()`: returns the caller's `accepted` friends (`id`, other user's `id` and `username`), incoming pending and outgoing pending requests, in three arrays.
- `listFriendSessions(friendUserId)`: `Not found` unless an accepted friendship exists; returns that friend's sessions newest first (with `sets` count).
- `getFriendSession(friendUserId, sessionId)`: same friendship check, and the session must belong to that friend; returns session with sets asc by `createdAt`, else `null`.
- All actions call `getCurrentUser()` and throw `Unauthorized` when null. Authorization is enforced in the action. Failure shape for unknown/forbidden targets is the same, so it does not leak which users exist beyond the username lookup in `sendFriendRequest`.

### Routes and UI

- New top-level navigation in the header: `Workouts` (`/`) and `Friends` (`/friends`), current one marked with `aria-current="page"`.
- `/friends`: async Server Component, `force-dynamic`, calls `listFriendships`, renders `FriendsPage`:
  - Add friend form: `Username` input + `Send request` (native `disabled` while pending; input clears only on success; inline `role="alert"` errors use the generic copy except the friendly messages `User not found`, `Already requested`, `Already friends`, which are allowed here because they are actionable).
  - `Requests` section: incoming (`Accept`, `Decline`) and outgoing (`Cancel`), hidden when empty.
  - `Friends` section: list of usernames, each linking to `/friends/[username]`, with a `Remove` button. Empty message `No friends yet.`
  - State per AGENTS.md: apply returned rows locally, coerce dates, no refetch, generic alert on failure and rethrow.
- `/friends/[username]`: friend's workouts as `WorkoutCard`s (spec 014) in read-only mode: no `Delete`, each card links to `/friends/[username]/[id]`. Not a friend or unknown username → `notFound()`.
- `/friends/[username]/[id]`: read-only workout detail (title, sets list, back link to `/friends/[username]`). Non-integer id, not a friend, or session not the friend's → `notFound()`.
- New shared components (with story + test each): `FriendsPage` (pages), `FriendRequestList` and `FriendList` (organisms) if the page gets too large, `ReadOnlyWorkoutPage` (pages) for the friend detail. `WorkoutCard` gets an optional `href` override and makes `onDelete` optional (renders no delete button when absent). `WorkoutSetList` gets a `readOnly` mode (or a read-only sibling) that renders no edit/delete controls. Any change to those existing components keeps their current behavior when the new props are absent.
- Header shows a small badge with the count of incoming pending requests (computed by the route/layout server-side, passed as a prop).
- Mobile friendly like spec 014.

### Tests

- Action tests (`tests/actions/friendship/...`, `prisma/test.db`): request → accept flow; cross-request auto-accept; duplicate and self requests rejected; only the addressee can accept/decline; only the requester can cancel; `listFriendSessions` and `getFriendSession` refuse non-friends, pending friends, and a session belonging to someone else; access disappears after `removeFriend`.
- Component tests + `Default` story for each new component; existing `WorkoutCard` and `WorkoutSetList` tests still pass and new tests cover read-only mode.
- E2E (two browser contexts with virtual authenticators, unique usernames): A registers and creates a workout; B registers, sends a request; A accepts; B sees A's workout under Friends and opens it, with no edit or delete controls; A removes B; B reloads `/friends/<A>` and gets not-found.

## Out of scope

- Blocking, per-workout privacy, public/shareable links, groups, comments, likes, notifications (email or push), friend suggestions or username search/autocomplete, copying a friend's workout into your own list, activity feed.
