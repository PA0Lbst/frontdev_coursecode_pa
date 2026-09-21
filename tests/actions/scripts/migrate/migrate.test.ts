import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate, splitStatements } from "../../../../scripts/migrate";

let dir: string;
let url: string;

async function addMigration(name: string, sql: string) {
  await mkdir(join(dir, "migrations", name), { recursive: true });
  await writeFile(join(dir, "migrations", name, "migration.sql"), sql);
}

async function tableNames() {
  const client = createClient({ url });
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  client.close();
  return result.rows.map((row) => String(row.name));
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "migrate-test-"));
  url = `file:${join(dir, "test.db")}`;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const opts = () => ({
  url,
  dir: join(dir, "migrations"),
  allowFile: true,
});

describe("migrate", () => {
  it("applies migrations in name order and records them", async () => {
    await addMigration("2_second", 'CREATE TABLE "B" ("id" INTEGER);');
    await addMigration("1_first", '-- CreateTable\nCREATE TABLE "A" ("id" INTEGER);\n');
    const result = await migrate(opts());
    expect(result).toEqual({ skipped: false, applied: ["1_first", "2_second"] });
    expect(await tableNames()).toEqual(
      expect.arrayContaining(["A", "B", "_migrations"]),
    );
  });

  it("applies nothing on a second run", async () => {
    await addMigration("1_first", 'CREATE TABLE "A" ("id" INTEGER);');
    await migrate(opts());
    const second = await migrate(opts());
    expect(second).toEqual({ skipped: false, applied: [] });
  });

  it("rolls back a failing migration and does not record it", async () => {
    await addMigration(
      "1_bad",
      'CREATE TABLE "A" ("id" INTEGER);\nINSERT INTO "Missing" VALUES (1);',
    );
    await expect(migrate(opts())).rejects.toThrow();
    const tables = await tableNames();
    expect(tables).not.toContain("A");
    const client = createClient({ url });
    const rows = await client.execute("SELECT name FROM _migrations");
    client.close();
    expect(rows.rows).toHaveLength(0);
  });

  it("skips file: URLs without allowFile", async () => {
    await addMigration("1_first", 'CREATE TABLE "A" ("id" INTEGER);');
    const result = await migrate({ ...opts(), allowFile: false });
    expect(result).toEqual({ skipped: true, applied: [] });
    expect(existsSync(join(dir, "test.db"))).toBe(false);
  });
});

describe("splitStatements", () => {
  it("ignores comment lines and trailing empty statements", () => {
    expect(
      splitStatements("-- one\nCREATE TABLE a (id INTEGER);\n\n-- two\nPRAGMA foreign_keys=ON;\n"),
    ).toEqual(["CREATE TABLE a (id INTEGER)", "PRAGMA foreign_keys=ON"]);
  });
});
