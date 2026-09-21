# Accounts with Passkeys

## Context

- Today the app is single-user: `WorkoutSession` (and its `WorkoutSet`s) have no owner, and `/` lists every session.
- Actions live in `src/actions/{resource}/{actionName}/`, no Route Handlers (AGENTS.md). Routes are async Server Components with `force-dynamic`.
- There is no auth, no `User` model, and no WebAuthn dependency.
- This spec is the foundation for spec 016 (friends and sharing): every workout must belong to exactly one account first.

## Goals

Every workout belongs to an account. Accounts sign in **only** with passkeys (WebAuthn). No passwords, no email/SMS codes, no OAuth.

## Requirements

### Dependencies (explicit exception to "no new packages")

- Add `@simplewebauthn/server` (server verification) and `@simplewebauthn/browser` (client ceremony). No other auth library.

### Data model

- `User`: `id`, `username` (unique, case-insensitive, 3–20 chars, `[a-z0-9_]`, stored lowercased), `createdAt`.
- `Passkey`: `id` (credential id, string, unique), `userId` → `User` (cascade), `publicKey` (bytes), `counter`, `transports` (nullable string), `createdAt`, `label` (nullable, e.g. device name).
- `AuthSession`: `id`, `userId` → `User` (cascade), `tokenHash` (unique, SHA-256 of the cookie token), `expiresAt`, `createdAt`.
- `AuthChallenge`: `id`, `challenge`, `purpose` (`register | authenticate`), `username` (nullable), `expiresAt`. Single use, 5 minute TTL.
- `WorkoutSession` gains required `userId` → `User` (cascade). `WorkoutSet` is reached through its session.
- Migration for existing data: workouts that already exist have no owner. They are assigned to the **first account ever registered**; if none exists yet the migration keeps them in a nullable-then-claimed state (implementation detail for the plan; must not lose rows).

### Registration and sign-in (Server Actions only)

- Register: choose a username → server creates a registration challenge → browser runs `startRegistration` → server verifies, creates `User` + `Passkey`, signs the user in. Username already taken → generic-safe error `That username is taken.` (usernames are public identifiers; this is not an enumeration risk).
- Sign in: browser asks for an authentication challenge (username **not** required: discoverable credentials / `userVerification: "preferred"`, conditional UI where supported) → `startAuthentication` → server verifies signature, `counter`, origin and RP ID, then creates an `AuthSession`.
- Relying Party: `rpID` and `origin` come from env (`WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`), defaults `localhost` / `http://localhost:3000`.
- Challenges are consumed on use and rejected when expired.
- Actions (each its own folder, one exported function): `startRegistration`, `finishRegistration`, `startAuthentication`, `finishAuthentication`, `signOut`, `getCurrentUser`, plus `addPasskey` (start/finish) for a signed-in user.
- No Route Handlers. Ceremony options and responses are plain serializable objects passed between client and Server Actions.

### Sessions

- Cookie `session`: random 32-byte token, `HttpOnly`, `Secure` outside dev, `SameSite=Lax`, `Path=/`, 30-day expiry. Only its SHA-256 is stored.
- `getCurrentUser()` reads the cookie via `cookies()` from `next/headers`, looks up a non-expired `AuthSession`, returns `User | null`.
- `signOut` deletes the `AuthSession` row and the cookie.
- Read `node_modules/next/dist/docs/` for `cookies`, and for the Next 16 `proxy` file convention, before writing code.

### Authorization on existing features

- Every `workoutSession` and `workoutSet` action calls `getCurrentUser()` and throws `Unauthorized` when null.
- `listSessions` returns only the caller's sessions. `getSession`, `deleteSession`, `createSet`, `updateSet`, `deleteSet` verify the target belongs to the caller; otherwise behave as if it does not exist (`getSession` → `null`, mutations throw `Not found`). Ownership is checked in the action, never only in the UI.
- `createSession` sets `userId` from the current user; clients never send a user id.

### Routes and UI

- New `/sign-in`: register form (username) and `Sign in with passkey` button. One page, both flows. Errors are generic `role="alert"` copy (`Something went wrong. Try again.`) except the username-taken message above. Browser without WebAuthn support shows a clear unsupported message.
- `/` and `/workouts/[id]`: no session → `redirect("/sign-in")`. Signed-in on `/sign-in` → `redirect("/")`.
- Header shows the username and a `Sign out` button when signed in.
- New `/account`: list of the user's passkeys (label, created date), `Add a passkey` button (so a user can register a second device), remove a passkey (blocked when it is the last one: `You need at least one passkey.`).
- New client pages `SignInPage` and `AccountPage` in `pages`, following the "Client vs server" and injection rules in AGENTS.md (actions passed as props from the route; WebAuthn browser calls live in the page component, never in molecules/organisms).
- Mobile friendly like spec 014: 44px tap targets, no horizontal scroll at 320px.

### Security requirements

- Verify `origin`, `rpID`, challenge, signature and monotonically increasing `counter` (when non-zero) on every assertion.
- Session token compared by hash lookup only; never log tokens or challenges.
- Rate-limit `startAuthentication`/`finishAuthentication` failures per IP or per challenge in a simple DB-backed way, or document why it is deferred in the plan.
- No account recovery flow. Losing every passkey means losing the account; the `/account` copy tells users to add a second passkey.

### Tests

- Action tests (`tests/actions/...`, `prisma/test.db`): challenge single-use and expiry; `finishRegistration` creates user + passkey; duplicate username rejected; ownership checks (user B cannot read, update or delete user A's session or sets); `listSessions` scoping; `signOut`. WebAuthn attestation/assertion responses are generated with a software authenticator helper in the test folder; do not mock `@simplewebauthn/server` verification for the ownership tests, and mock `next/headers` `cookies` only.
- Component tests + `Default` story for `SignInPage` and `AccountPage` (mock action props with `vi.fn()`, mock `@simplewebauthn/browser`).
- E2E: Playwright Chromium with a **virtual authenticator** (CDP `WebAuthn.addVirtualAuthenticator`): register a unique username → land on `/` → create a workout → sign out → sign in with passkey → workout is still there. Existing workout e2e updated to sign in first (shared helper).

## Out of scope

- Passwords, email, SMS, magic links, OAuth, account recovery, username change, account deletion, admin roles.
- Friends and sharing (spec 016).
- Cross-device sync of passkeys beyond what the platform provides.
