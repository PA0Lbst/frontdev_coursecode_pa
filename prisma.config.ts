import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI only runs against local SQLite files (generate, migrate dev/deploy).
// Remote libsql:// databases are migrated by scripts/migrate.ts.
const url = process.env.DATABASE_URL;
const localUrl = url?.startsWith("file:") ? url : "file:./prisma/dev.db";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: localUrl,
  },
});
