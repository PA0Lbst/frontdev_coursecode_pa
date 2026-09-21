# Tasks: Accounts with Passkeys

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Only add `@simplewebauthn/server` and `@simplewebauthn/browser`; no other package. Do not add Route Handlers, `proxy.ts`, `revalidatePath`, or `router.refresh`. Do not edit `src/generated/prisma` by hand. Components must not import `@/actions/...` or Prisma. Never show `error.message` in the UI except `That username is taken.` and `You need at least one passkey.`. Read the Next docs for `cookies` and `redirect` before writing code.

## 1. Dependencies and schema

- [x] `npm install @simplewebauthn/server @simplewebauthn/browser`.
- [x] Add `User`, `Passkey`, `AuthSession`, `AuthChallenge` to `prisma/schema.prisma` and `userId` + relation on `WorkoutSession`.
- [x] `npm run prisma:migrate -- --create-only --name accounts_passkeys`; prepend `DELETE FROM "WorkoutSet"; DELETE FROM "WorkoutSession";` to the SQL; apply; `npm run prisma:generate`.

## 2. Auth foundation

- [x] Create `src/data/username.ts` (`normalizeUsername`, `isValidUsername`).
- [x] Create `src/actions/auth/config.ts` (rpID, origin, rpName, cookie name, durations).
- [x] Create `src/actions/auth/helpers.ts` (no `"use server"`): `hashToken`, `createSessionCookie`, `requireUser`, `consumeChallenge`.
- [x] Create `getCurrentUser` action.

## 3. Test infrastructure

- [x] Add `tests/actions/helpers/cookieStore.ts` and mock `next/headers` `cookies` in `tests/actions/setup.ts`; reset the store and clear all tables (including new ones) in `beforeEach`.
- [x] Add `tests/actions/helpers/auth.ts` with `signInAs(username)`.
- [x] Add software authenticator helpers (`createAttestation`, `createAssertion`, minimal CBOR encoder) to the same helper file. Do not mock `@simplewebauthn/server`.

## 4. Auth actions

- [x] `startRegistration` + `finishRegistration` + tests (taken/invalid username, success sets cookie, expired and reused challenge).
- [x] `startAuthentication` + `finishAuthentication` + tests (valid, wrong challenge, unknown credential, bad counter, generic error).
- [x] `signOut` (deletes session row and cookie, then `redirect("/sign-in")`) + test.
- [x] `getCurrentUser` test (no cookie, expired session).
- [x] `listPasskeys`, `startAddPasskey`, `finishAddPasskey`, `removePasskey` + tests (last-passkey guard, foreign passkey → `Not found`).

## 5. Ownership on workout actions

- [x] Add `requireUser()` to `createSession`, `listSessions`, `getSession`, `deleteSession`, `createSet`, `updateSet`, `deleteSet`; scope every query by owner as in the plan.
- [x] Update existing action tests to `signInAs` first; update the `Session not found` expectation to `Not found`.
- [x] Add ownership tests: signed-out → `Unauthorized`; user B cannot read, update or delete user A's session or sets; `listSessions` returns only own sessions.

## 6. Header and shared wiring

- [x] `Header`: `"use client"`, optional `username` / `onSignOut`, account link + `Sign out` button (native `disabled` while pending); update its test and story.
- [x] `PageTemplate`: forward optional `username` / `onSignOut`.
- [x] `WorkoutListPage` and `WorkoutPage`: add optional `username` / `signOut` props forwarded to `PageTemplate`; existing tests and stories still pass.

## 7. Pages

- [x] Create `SignInPage.tsx` (register + passkey sign-in, unsupported-browser alert, `router.push("/")` on success).
- [x] Create `SignInPage.stories.tsx` (`Pages/SignInPage`, fullscreen, autodocs, one `Default` with `play`) and `SignInPage.test.tsx` (mock `@simplewebauthn/browser` and `next/navigation`).
- [x] Create `AccountPage.tsx` (passkey list, add, remove, last-passkey message, local state updates, coerce `createdAt`).
- [x] Create `AccountPage.stories.tsx` and `AccountPage.test.tsx`.

## 8. Routes

- [x] Create `src/app/sign-in/page.tsx` (`force-dynamic`, signed-in → `redirect("/")`).
- [x] Create `src/app/account/page.tsx` (`force-dynamic`, guard, inject actions).
- [x] Guard `src/app/page.tsx` and `src/app/workouts/[id]/page.tsx` with `getCurrentUser` + `redirect("/sign-in")`; pass `username` and `signOut`.

## 9. E2E

- [x] Create `tests/e2e/helpers/auth.ts` (`register` with a CDP virtual authenticator).
- [x] Create `tests/e2e/auth.spec.ts` (register → create workout → sign out → passkey sign-in → workout still there; signed-out `/` redirects).
- [x] Update `tests/e2e/workout.spec.ts` to register a unique user first.

## Verify

- [x] `npx tsc --noEmit` passes.
- [x] `npm run lint` passes.
- [x] `npm test` passes (storybook, components, actions).
- [x] `npm run test:e2e` passes.
