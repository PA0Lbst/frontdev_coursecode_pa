// Applies each prisma/migrations/<name>/migration.sql to a remote libSQL (Turso) database.
// Local file: databases are managed by Prisma Migrate and are skipped.
// Runs with Node's native type stripping: no enums, no parameter properties.
import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return withoutComments
    .split(/;[ \t]*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function migrate(opts: {
  url: string;
  authToken?: string;
  dir: string;
  allowFile?: boolean;
}): Promise<{ skipped: boolean; applied: string[] }> {
  if (opts.url.startsWith("file:") && !opts.allowFile) {
    console.log(
      "Skipping migrations: local database is managed by Prisma Migrate.",
    );
    return { skipped: true, applied: [] };
  }

  const client = createClient({ url: opts.url, authToken: opts.authToken });
  const applied: string[] = [];
  try {
    await client.execute(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT NOT NULL PRIMARY KEY, appliedAt TEXT NOT NULL)",
    );
    const done = await client.execute("SELECT name FROM _migrations");
    const doneNames = new Set(done.rows.map((row) => String(row.name)));

    const entries = await readdir(opts.dir, { withFileTypes: true });
    const names = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const name of names) {
      if (doneNames.has(name)) continue;
      const sql = await readFile(join(opts.dir, name, "migration.sql"), "utf8");
      await client.batch(
        [
          ...splitStatements(sql).map((statement) => ({
            sql: statement,
            args: [],
          })),
          {
            sql: "INSERT INTO _migrations (name, appliedAt) VALUES (?, ?)",
            args: [name, new Date().toISOString()],
          },
        ],
        "write",
      );
      applied.push(name);
      console.log(`Applied migration ${name}`);
    }
  } finally {
    client.close();
  }
  return { skipped: false, applied };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  // DATABASE_TURSO_* are set by the Vercel Turso integration (prefix DATABASE).
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_TURSO_DATABASE_URL ||
    "file:./prisma/dev.db";
  if (process.env.VERCEL && !url.startsWith("libsql:")) {
    console.error("DATABASE_URL must be a libsql:// URL on Vercel.");
    process.exit(1);
  }
  migrate({
    url,
    authToken:
      process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_TURSO_AUTH_TOKEN,
    dir: join(process.cwd(), "prisma", "migrations"),
    allowFile: process.argv.includes("--allow-file"),
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
