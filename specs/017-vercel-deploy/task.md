# Tasks: Vercel Deployment

Source: [plan.md](./plan.md) · [spec.md](./spec.md)

Only add `@prisma/adapter-libsql`; no other package (no `tsx`, no `dotenv` changes). Do not change `prisma/schema.prisma`, any existing migration, or `src/generated/prisma` by hand. Do not add Route Handlers, `vercel.json`, `revalidatePath`, or `router.refresh`. Local `prisma/dev.db` and `prisma/test.db` must keep working and must never be modified by `npm run build` or `npm run db:migrate`. Tests never point at Turso. Read the Next docs for `serverExternalPackages` before editing `next.config.ts`. Leave the Next.js block at the bottom of `AGENTS.md` unchanged.

## 1. Dependencies and scripts

- [x] `npm install @prisma/adapter-libsql` and confirm the exported class name in `node_modules/@prisma/adapter-libsql`.
- [x] `npm uninstall @prisma/adapter-better-sqlite3`.
- [x] Add `postinstall`, `build` and `db:migrate` scripts and `"engines": { "node": "22.x" }` to `package.json`.

## 2. Prisma client

- [x] Rewrite `src/prisma/prismaClient.ts` with `PrismaLibSql`, `DATABASE_URL` (default `file:./prisma/dev.db`), `TURSO_AUTH_TOKEN`, and the `globalThis` singleton outside production.
- [x] `npm run prisma:generate`.

## 3. Bundler and test config

- [x] Update `next.config.ts` `serverExternalPackages` (replace the better-sqlite3 entry; add libSQL packages only if the Next docs do not auto-externalize them).
- [x] Remove the better-sqlite3 entries from `vitest.config.ts` `server.deps.external` (use libSQL externals only if the actions project fails to load the native module).
- [x] Run `npm test` and `npm run test:e2e`; fix config until both pass on local SQLite files through libSQL.

## 4. Migrate script

- [x] Create `scripts/migrate.ts` with `splitStatements`, `migrate({ url, authToken, dir, allowFile })` and the guarded CLI entry, following the plan (skip on `file:` unless `--allow-file`; own `_migrations` table; one atomic `batch` per migration; exit 1 on failure; exit 1 on Vercel without a `libsql:` URL).
- [x] Use only Node 22 type-stripping-safe syntax (no enums, no parameter properties, `import type`).
- [x] Create `tests/actions/scripts/migrate/migrate.test.ts` on a temp migrations folder and temp `file:` database: applies in order, idempotent second run, failing migration rolls back and is not recorded, `file:` without `allowFile` is skipped without creating a file, `splitStatements` cases.

## 5. WebAuthn config

- [x] Update `rpID` and `origin` in `src/actions/auth/config.ts`: env overrides, then Vercel production/preview host, then localhost. Leave the other exports unchanged.

## 6. Docs and env

- [x] Update `.env.example` (keep `DATABASE_URL`; add commented `TURSO_AUTH_TOKEN`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` with comments).
- [x] Update `README.md`: stack line, scripts list (`db:migrate`), file structure (`scripts/migrate.ts`), new `## Deploy to Vercel` section with the six steps, the notes (separate Preview database, empty production start, domain change invalidates passkeys, `DATABASE_URL` needed at install) and the smoke-test checklist.
- [x] Update `AGENTS.md` Stack line and Backend section as in the plan.

## 7. Verify

- [x] `npm run build` succeeds locally, logs the migration skip, and `prisma/dev.db` is unchanged (compare mtime/size before and after).
- [x] `npm run start` serves the built app and sign-in/workout flows still work locally.
- [x] `npm test` passes (storybook, components, actions).
- [x] `npm run test:e2e` passes.
- [x] `npm run lint` passes.
- [x] `git status` shows no changes to `prisma/schema.prisma`, existing migrations, or hand edits in `src/generated/prisma` (regenerated output only).
