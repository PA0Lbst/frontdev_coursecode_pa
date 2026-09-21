# Tasks: Friends and Shared Workouts

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Do not add npm packages. Do not edit `src/generated/prisma` by hand (regenerate only). Do not add Route Handlers, `revalidatePath`, `router.refresh`, or optimistic rows. Components must not import `@/actions/...` or Prisma. Existing behavior of `WorkoutCard`, `WorkoutSetItem`, `WorkoutSetList` must not change when the new props are absent. Friends can never write to someone else's workouts.

## 1. Schema

- [x] Add `Friendship` to `prisma/schema.prisma` (`requesterId`, `addresseeId`, cascade relations, `status String @default("pending")`, `createdAt`, `@@unique([requesterId, addresseeId])`) and the two back-relations on `User`.
- [x] Run `npm run prisma:migrate -- --name friendships` and `npm run prisma:generate`.
- [x] Add `prisma.friendship.deleteMany()` before `user.deleteMany()` in `tests/actions/setup.ts`.

## 2. Shared types and helpers

- [x] Create `src/data/friendship.ts` (`FriendUser`, `FriendshipEntry`, `FriendshipLists`, `SendFriendRequestResult`, friendly error constants).
- [x] Create `src/actions/friendship/helpers.ts` (`findFriendshipBetween`, `requireAcceptedFriend`, `toEntry`); no `"use server"`.

## 3. Actions (each `"use server"`, one named export, `requireUser()` first)

- [x] `sendFriendRequest(username)`: lowercase lookup; `{ error }` for `User not found` / `Already requested` / `Already friends`; self throws; reverse pending request auto-accepts; returns `{ entry, status }`.
- [x] `acceptFriendRequest(id)`: addressee only, pending only; returns `FriendshipEntry`.
- [x] `declineFriendRequest(id)`: addressee only; deletes row.
- [x] `cancelFriendRequest(id)`: requester only, pending only; deletes row.
- [x] `removeFriend(id)`: either party, accepted only; deletes row.
- [x] `listFriendships()`: returns `{ friends, incoming, outgoing }`.
- [x] `listFriendSessions(friendUserId)`: `Not found` unless accepted; sessions newest first with `sets` asc.
- [x] `getFriendSession(friendUserId, sessionId)`: friendship check; session must be the friend's; else `null`.
- [x] Unknown/forbidden targets all throw `Not found`; unauthenticated throws `Unauthorized`.

## 4. Action tests (`tests/actions/friendship/<action>/<action>.test.ts`)

- [x] `sendFriendRequest`: pending create, lowercase, unknown user, duplicate, already friends, self, cross-request auto-accept, unauthenticated.
- [x] `acceptFriendRequest`, `declineFriendRequest`, `cancelFriendRequest`, `removeFriend`: role checks and state checks.
- [x] `listFriendships`: three arrays for both sides.
- [x] `listFriendSessions` / `getFriendSession`: refuse non-friends, pending friends, other user's session; ordering; access gone after `removeFriend`.

## 5. Read-only support in existing components

- [x] `WorkoutCard`: optional `href` override, optional `onDelete` (no `⋯` menu and `pr-4` when absent). Update test and story controls.
- [x] `WorkoutSetItem`: `readOnly` hides Edit/Delete; `onUpdate`/`onDelete` optional. Add test.
- [x] `WorkoutSetList`: `readOnly` hides `WorkoutSetForm` and passes `readOnly` to items; handlers optional. Add test.

## 6. Header nav

- [x] `Header`: when `username` is set, `<nav aria-label="Main">` with `Workouts` (`/`) and `Friends` (`/friends`); `usePathname()` sets `aria-current="page"` (`/` and `/workouts/*` → Workouts, `/friends*` → Friends).
- [x] `Header`: `pendingRequestCount` badge on Friends (aria-hidden count + `sr-only` text) when > 0; no nav without `username`.
- [x] `PageTemplate`: accept and pass `pendingRequestCount`.
- [x] Update `Header` test (mock `usePathname`) and story (`nextjs.navigation.pathname`), keep sign-out behavior; `PageTemplate` test if affected.

## 7. New components (each: component, `.stories.tsx` with `Default` + `play`, `.test.tsx`)

- [x] `FriendRequestList` (organism): incoming Accept/Decline, outgoing Cancel, hidden when empty, native `disabled` for `pendingId`.
- [x] `FriendList` (organism): username links to `/friends/[username]`, `Remove` button, `No friends yet.`.
- [x] `FriendsPage` (page): add-friend form, sections, local state updates for all five actions, friendly vs generic alerts, rethrow on failure, live `pendingRequestCount`.
- [x] `FriendWorkoutsPage` (page): back link, heading, read-only `WorkoutCard` grid with `href` override, empty message.
- [x] `ReadOnlyWorkoutPage` (page): back link, title, `WorkoutSetList readOnly`.
- [x] Stories: correct `title` (`Organisms/…`, `Pages/…`), `tags: ["autodocs"]`, curated `controls.include`, layout per layer; imports from `./Component`, no `@/`.

## 8. Routes and wiring

- [x] `src/app/friends/page.tsx`: `force-dynamic`, redirect when signed out, `listFriendships`, render `FriendsPage` with the five actions.
- [x] `src/app/friends/[username]/page.tsx`: resolve friend via `listFriendships`; `notFound()` if not an accepted friend; `listFriendSessions` → `setCount`; render `FriendWorkoutsPage`.
- [x] `src/app/friends/[username]/[id]/page.tsx`: friend lookup, integer id check, `getFriendSession`; `notFound()` on any miss; render `ReadOnlyWorkoutPage`.
- [x] `/`, `/workouts/[id]`, `/account`: call `listFriendships()` and pass `pendingRequestCount={incoming.length}` through `WorkoutListPage`, `WorkoutPage`, `AccountPage` to `PageTemplate`.

## 9. E2E

- [x] `tests/e2e/friends.spec.ts`: two browser contexts with unique usernames (`register`); A creates workout + set; B sends request; A accepts; B opens A's workout under Friends and sees no Edit/Delete/Add; A removes B; B reloads `/friends/<A>` and gets not-found.

## Verify

- [x] `npm test` passes (storybook, components, actions projects).
- [x] `npm run test:e2e` passes.
- [x] `npm run lint` and `npm run build` pass.
- [x] Manual check on a phone-width viewport: header nav wraps, Friends page and friend cards are usable.
