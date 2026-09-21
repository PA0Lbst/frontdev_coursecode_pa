# Implementation Plan: Friends and Shared Workouts

Source spec: [spec.md](./spec.md)

Adds a `Friendship` model, eight friendship Server Actions, a Friends tab (`/friends`, `/friends/[username]`, `/friends/[username]/[id]`), a main nav with a pending-request badge in `Header`, and read-only modes for `WorkoutCard`, `WorkoutSetItem` and `WorkoutSetList`. No new npm package.

## Technical context

- Spec 015 is in place: `WorkoutSession.userId`, `requireUser()` (`src/actions/auth/helpers.ts`, throws `Unauthorized`), `getCurrentUser()`, `User.username` unique and stored lowercase, `normalizeUsername` in `src/data/username.ts`.
- Action pattern: `src/actions/workoutSession/getSession/getSession.ts` (`"use server"`, `requireUser()`, direct `prisma`, throw `Error("Not found")` for missing/forbidden targets).
- `src/actions/auth/startRegistration` returns `{ error }` for user-facing failures; `sendFriendRequest` follows that (Next masks thrown messages in production).
- Prisma SQLite: statuses are `String` (no enum); `AuthChallenge.purpose` already does this.
- Routes are async Server Components with `force-dynamic`, redirect to `/sign-in` when `getCurrentUser()` is null, and pass actions as props (see `src/app/workouts/[id]/page.tsx`).
- `Header` is a client component (`Link`, sign-out state). `PageTemplate` renders `Header` and takes `username` / `onSignOut`. Pages using `PageTemplate` with a user: `WorkoutListPage`, `WorkoutPage`, `AccountPage`. `SignInPage` has no user and no nav.
- `WorkoutCard` links to `/workouts/${id}` and always renders the `⋯` menu with Delete. `WorkoutSetItem` always renders Edit/Delete; `WorkoutSetList` always renders `WorkoutSetForm`.
- `listSessions` includes `sets`; `src/app/page.tsx` maps to `setCount`. `listFriendSessions` returns the same shape and the friend route does the same mapping.
- `tests/actions/setup.ts` clears tables in `beforeEach`; `signInAs` / `signOutCookie` in `tests/actions/helpers/auth.ts` switch the mocked cookie user. `globalSetup` runs `prisma migrate deploy` on `test.db`.
- E2E helpers: `register(page, username?)` and `addVirtualAuthenticator` in `tests/e2e/helpers/auth.ts` (Playwright `page`, one authenticator per page/context).

## Target structure

```
prisma/schema.prisma                                                     [modified]
prisma/migrations/<ts>_friendships/                                      [new, generated]
src/generated/prisma/*                                                   [regenerated, not hand-edited]
src/data/friendship.ts                                                   [new]
src/actions/friendship/helpers.ts                                        [new]
src/actions/friendship/sendFriendRequest/sendFriendRequest.ts            [new]
src/actions/friendship/acceptFriendRequest/acceptFriendRequest.ts        [new]
src/actions/friendship/declineFriendRequest/declineFriendRequest.ts      [new]
src/actions/friendship/cancelFriendRequest/cancelFriendRequest.ts        [new]
src/actions/friendship/removeFriend/removeFriend.ts                      [new]
src/actions/friendship/listFriendships/listFriendships.ts                [new]
src/actions/friendship/listFriendSessions/listFriendSessions.ts          [new]
src/actions/friendship/getFriendSession/getFriendSession.ts              [new]
src/app/friends/page.tsx                                                 [new]
src/app/friends/[username]/page.tsx                                      [new]
src/app/friends/[username]/[id]/page.tsx                                 [new]
src/app/page.tsx, src/app/workouts/[id]/page.tsx, src/app/account/page.tsx  [modified: pendingRequestCount]
src/components/organisms/Header/Header.{tsx,stories.tsx,test.tsx}        [modified]
src/components/templates/PageTemplate/PageTemplate.tsx                   [modified]
src/components/molecules/WorkoutCard/WorkoutCard.{tsx,stories.tsx,test.tsx}            [modified]
src/components/molecules/WorkoutSetItem/WorkoutSetItem.{tsx,test.tsx}    [modified]
src/components/organisms/WorkoutSetList/WorkoutSetList.{tsx,test.tsx}    [modified]
src/components/organisms/FriendRequestList/FriendRequestList.{tsx,stories.tsx,test.tsx}  [new]
src/components/organisms/FriendList/FriendList.{tsx,stories.tsx,test.tsx}                [new]
src/components/pages/FriendsPage/FriendsPage.{tsx,stories.tsx,test.tsx}                  [new]
src/components/pages/FriendWorkoutsPage/FriendWorkoutsPage.{tsx,stories.tsx,test.tsx}    [new]
src/components/pages/ReadOnlyWorkoutPage/ReadOnlyWorkoutPage.{tsx,stories.tsx,test.tsx} [new]
src/components/pages/{WorkoutListPage,WorkoutPage,AccountPage}/*.tsx     [modified: pass pendingRequestCount]
tests/actions/setup.ts                                                   [modified]
tests/actions/friendship/<actionName>/<actionName>.test.ts               [new, one per action]
tests/e2e/friends.spec.ts                                                [new]
```

`FriendWorkoutsPage` is not named in the spec but is needed: routes render page components, and `/friends/[username]` needs one.

## Schema

```prisma
model Friendship {
  id          Int      @id @default(autoincrement())
  requesterId Int
  requester   User     @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  addresseeId Int
  addressee   User     @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)
  status      String   @default("pending") // "pending" | "accepted"
  createdAt   DateTime @default(now())

  @@unique([requesterId, addresseeId])
}
```

- `User` gains `sentRequests Friendship[] @relation("FriendshipRequester")` and `receivedRequests Friendship[] @relation("FriendshipAddressee")`.
- Migrate with `npm run prisma:migrate -- --name friendships`, then `npm run prisma:generate`. Never edit `src/generated/prisma`.

## `src/data/friendship.ts` (shared types, no server imports)

```ts
export type FriendUser = { id: number; username: string };
export type FriendshipEntry = { id: number; user: FriendUser }; // user = the OTHER person
export type FriendshipLists = {
  friends: FriendshipEntry[];
  incoming: FriendshipEntry[];
  outgoing: FriendshipEntry[];
};
export type SendFriendRequestResult =
  | { entry: FriendshipEntry; status: "pending" | "accepted" }
  | { error: "User not found" | "Already requested" | "Already friends" };
export const FRIEND_ERRORS = ["User not found", "Already requested", "Already friends"];
```

## Actions

All call `requireUser()` first. Any unknown, forbidden or wrong-state target throws `new Error("Not found")` (same failure for all, no leak). Each action file: `"use server"`, one named export.

`src/actions/friendship/helpers.ts` (no `"use server"`):
- `findFriendshipBetween(a, b)`: `findFirst` with `OR` over both directions.
- `requireAcceptedFriend(userId, friendUserId)`: throws `Not found` unless an `accepted` row exists between them.
- `toEntry(row, viewerId)`: maps a row with `requester` / `addressee` included to `{ id, user: { id, username } }` for the other party.

Actions:
- `sendFriendRequest(username)`: `normalizeUsername`; user lookup; unknown → `{ error: "User not found" }`; self → `throw new Error("Not found")` (generic copy in UI). Existing row via `findFriendshipBetween`:
  - `accepted` → `{ error: "Already friends" }`
  - `pending` where caller is requester → `{ error: "Already requested" }`
  - `pending` where caller is addressee → update to `accepted`, return `{ entry, status: "accepted" }`
  - none → create pending, return `{ entry, status: "pending" }`
  - Catch a unique-constraint race (`P2002`) → re-run the lookup once, or return `Already requested`.
- `acceptFriendRequest(id)`: row must have `addresseeId = caller` and `status = "pending"`, else `Not found`; update to `accepted`; return `FriendshipEntry` (other user = requester).
- `declineFriendRequest(id)`: addressee only, pending only; delete. Returns `void`.
- `cancelFriendRequest(id)`: requester only, pending only; delete. Returns `void`.
- `removeFriend(id)`: caller is either party, `accepted` only; delete. Returns `void`.
- `listFriendships()`: one `findMany` with `OR [requesterId, addresseeId] = caller`, `include` both users, ordered by `createdAt desc`. Split: `accepted` → `friends`; `pending` with addressee = caller → `incoming`; pending with requester = caller → `outgoing`. Returns `FriendshipLists`.
- `listFriendSessions(friendUserId)`: `requireAcceptedFriend`; `workoutSession.findMany({ where: { userId: friendUserId }, orderBy: { createdAt: "desc" }, include: { sets: { orderBy: { createdAt: "asc" } } } })`.
- `getFriendSession(friendUserId, sessionId)`: `requireAcceptedFriend`; `findFirst({ where: { id: sessionId, userId: friendUserId }, include: sets asc })`; returns row or `null`.

## Components

### `Header` / `PageTemplate`

- New optional prop `pendingRequestCount?: number` on `Header` and `PageTemplate` (passed through).
- When `username` is set, render `<nav aria-label="Main">` with `Link`s `Workouts` (`/`) and `Friends` (`/friends`), and keep the account link + Sign out in a separate group. No nav without `username`.
- `usePathname()` (from `next/navigation`): `/` or `/workouts/*` → Workouts `aria-current="page"`; `/friends` or `/friends/*` → Friends; anything else (incl. `null`) → none.
- Friends badge when `pendingRequestCount > 0`: `<span aria-hidden="true">` with the count plus `<span className="sr-only"> (N pending requests)</span>`.
- Header must stay usable on phones: nav wraps, links keep `min-h-11`.
- Test: `vi.mock("next/navigation", () => ({ usePathname: () => "/friends/bob" }))`. Story: `parameters.nextjs = { navigation: { pathname: "/" } }`. Add `pendingRequestCount` to controls include.

### `WorkoutCard`

- `href?: string` (default `` `/workouts/${id}` ``); `onDelete` becomes optional.
- When `onDelete` is absent: no `⋯` wrapper, link uses `pr-4` instead of `pr-16`. Hooks stay unconditional.
- Behavior unchanged when the new props are absent.

### `WorkoutSetItem` / `WorkoutSetList`

- `WorkoutSetItem`: `readOnly?: boolean`; `onUpdate` / `onDelete` optional. When `readOnly`, render the display row (exercise, `reps × weight kg`, date) without the Edit/Delete buttons.
- `WorkoutSetList`: `readOnly?: boolean`; `onAdd` / `onUpdate` / `onDelete` optional. When `readOnly`, no `WorkoutSetForm`; items get `readOnly`. Empty message stays `No sets yet.`.
- Add `controls.include` entries for `readOnly` where the stories curate props.

### `FriendRequestList` (organism)

- Props: `incoming: FriendshipEntry[]`, `outgoing: FriendshipEntry[]`, `onAccept(id)`, `onDecline(id)`, `onCancel(id)` (all `Promise<void>`-returning), `pendingId?: number | null`. Renders nothing when both arrays are empty; otherwise a `Requests` heading. Incoming rows: username + `Accept` / `Decline`; outgoing rows: username + `Cancel`. The button that fired is natively `disabled` while pending (`pendingId` set by the parent page); no Button `loading`. Presentational: no actions imported.

### `FriendList` (organism)

- Props: `friends: FriendshipEntry[]`, `onRemove(id)`, `pendingId?: number | null`. `Friends` heading; empty → `No friends yet.`. Each row: `Link` to `/friends/${user.username}` and a `Remove` button (`aria-label="Remove <username>"`).

### `FriendsPage` (page, client)

```ts
type FriendsPageProps = {
  username?: string;
  signOut?: () => Promise<void>;
  initialFriendships: FriendshipLists;
  sendFriendRequest: (username: string) => Promise<SendFriendRequestResult>;
  acceptFriendRequest: (id: number) => Promise<FriendshipEntry>;
  declineFriendRequest: (id: number) => Promise<void>;
  cancelFriendRequest: (id: number) => Promise<void>;
  removeFriend: (id: number) => Promise<void>;
};
```

- State: the three lists, `error`, `pendingId`, add-form `sending` flag. Wrapped in `PageTemplate` with `pendingRequestCount={incoming.length}` (live, from local state).
- Add form: `label` + `Input` `Username`, `Button` `Send request` (`disabled` while sending). Success: `status === "pending"` → append to `outgoing`; `"accepted"` → remove the same `id` from `incoming`, prepend to `friends`. Clear input on success only. `{ error }` → show it in the `role="alert"` (allowed messages only). Thrown error → `Something went wrong. Try again.` and rethrow.
- Accept: remove from `incoming`, prepend returned entry to `friends`. Decline / Cancel / Remove: filter out by id. Any thrown error → generic alert, list unchanged, rethrow. Alert cleared on the next success.
- No refetch, no `router.refresh`, no `revalidatePath`.

### `FriendWorkoutsPage` (page)

- Props: `username?`, `signOut?`, `friendUsername: string`, `sessions: WorkoutSessionSummary[]` (type from `WorkoutListPage`), `pendingRequestCount?`. Server-rendered data only, so no `"use client"` needed unless `WorkoutCard` forces it (it does not: `WorkoutCard` is its own client boundary; keep the page a Server Component).
- Renders `Back to friends` link (`/friends`), heading `<friendUsername>'s workouts`, empty message `No workouts yet.`, a `grid grid-cols-1 sm:grid-cols-2` of `WorkoutCard` with `href={`/friends/${friendUsername}/${session.id}`}` and no `onDelete`. Coerces `createdAt` to `Date` in the component if it receives serialized dates (same `toClientSession` as `WorkoutListPage`; since it is a Server Component, receive `Date`s directly and skip coercion).

### `ReadOnlyWorkoutPage` (page)

- Props: `username?`, `signOut?`, `title: string`, `sets: WorkoutSet[]` (asc, as returned), `backHref: string`, `backLabel?: string`, `pendingRequestCount?`. Renders `Link` back, `h2` title, `WorkoutSetList readOnly`. Same reverse-order convention as `WorkoutPage` (newest first): `[...sets].reverse()`. Server Component; `createdAt` already `Date` on the server.

## Routes

- `/friends/page.tsx`: `getCurrentUser` (redirect), `listFriendships()`, render `FriendsPage` with `initialFriendships` and the five actions imported by file path.
- `/friends/[username]/page.tsx`: user redirect; `listFriendships()`; find `friends` entry whose `user.username === params.username.toLowerCase()`; none → `notFound()`. `listFriendSessions(entry.user.id)`, map `sets` → `setCount`, render `FriendWorkoutsPage` with `pendingRequestCount={lists.incoming.length}`.
- `/friends/[username]/[id]/page.tsx`: same friend lookup; `Number(id)` not integer → `notFound()`; `getFriendSession(entry.user.id, id)` null → `notFound()`; render `ReadOnlyWorkoutPage` with `title={workoutLabel(session)}`, `sets={session.sets}`, `backHref={`/friends/${entry.user.username}`}`.
- Friend resolution goes through `listFriendships` (no lookup-by-username action); authorization is still enforced again inside `listFriendSessions` / `getFriendSession`.
- `/`, `/workouts/[id]`, `/account`: call `listFriendships()` and pass `pendingRequestCount={incoming.length}` to their page components, which pass it to `PageTemplate`.
- All new routes `export const dynamic = "force-dynamic"`. No Route Handlers.

## Tests

- Action tests (`tests/actions/friendship/<action>/<action>.test.ts`, `prisma/test.db`, use `signInAs` / `signOutCookie`; add `prisma.friendship.deleteMany()` before `user.deleteMany()` in `tests/actions/setup.ts`):
  - `sendFriendRequest`: creates pending; lowercases input; unknown user → `{ error: "User not found" }`; duplicate → `Already requested`; already accepted → `Already friends`; self rejected; cross-request auto-accepts (single row, `status: "accepted"`); unauthenticated throws.
  - `acceptFriendRequest`: addressee accepts; requester cannot; already-accepted or unknown id → `Not found`.
  - `declineFriendRequest`: addressee deletes row; requester cannot. `cancelFriendRequest`: requester deletes; addressee cannot; not on accepted rows.
  - `removeFriend`: either party removes an accepted row; refuses pending and non-parties.
  - `listFriendships`: three arrays correct for both users; excludes unrelated rows.
  - `listFriendSessions` / `getFriendSession`: refuse non-friends and pending friends (`Not found`); `getFriendSession` returns `null` for a session owned by someone else or unknown; sessions newest first with sets; sets asc; access gone after `removeFriend`.
- Component tests (Vitest browser + `vitest-browser-react`) and one `Default` story with `play` per new component; curated `controls.include`; `layout: "centered"` for organisms, `"fullscreen"` for pages; `Organisms/FriendList`, `Organisms/FriendRequestList`, `Pages/FriendsPage`, `Pages/FriendWorkoutsPage`, `Pages/ReadOnlyWorkoutPage`.
- Existing `WorkoutCard`, `WorkoutSetItem`, `WorkoutSetList`, `Header`, `PageTemplate` tests keep passing; add read-only / `href` / badge / `aria-current` cases.
- E2E `tests/e2e/friends.spec.ts`: two `browser.newContext()` (A and B) each calling `register(page, uniqueUsername())`; A creates a workout with a unique name and one set; B sends a request; A sees it (badge / Requests section) and accepts; B opens Friends → A's link → workout → sees the set and no `Edit` / `Delete` / `Add` controls; A removes B; B reloads `/friends/<A>` and gets the not-found page.

## Implementation order

1. Schema + migration + `prisma:generate`; update `tests/actions/setup.ts`.
2. `src/data/friendship.ts` and `src/actions/friendship/helpers.ts`.
3. Actions (send, accept, decline, cancel, remove, list, listFriendSessions, getFriendSession) with their action tests.
4. Read-only support: `WorkoutCard`, `WorkoutSetItem`, `WorkoutSetList` (+ tests/stories).
5. `Header` nav + badge, `PageTemplate` prop (+ tests/stories).
6. `FriendRequestList`, `FriendList`, `FriendsPage`, `FriendWorkoutsPage`, `ReadOnlyWorkoutPage` (component, story, test each).
7. Routes `/friends*`; thread `pendingRequestCount` through `/`, `/workouts/[id]`, `/account` and their pages.
8. E2E spec; run `npm test`, `npm run test:e2e`, lint/build.

## Out of scope

- Blocking, per-workout privacy, public/shareable links, groups, comments, likes, notifications (email or push), friend suggestions or username search/autocomplete, copying a friend's workout, activity feed.
- Changing the workout/auth actions, `src/generated/prisma` by hand, Route Handlers, `revalidatePath` / `router.refresh`, optimistic rows, real-time updates of the badge on other pages.
- New npm packages.
