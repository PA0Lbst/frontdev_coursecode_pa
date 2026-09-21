/*
 * Prisma client for server code only. Do not import from UI.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaLibSql({
    // DATABASE_TURSO_* are set by the Vercel Turso integration (prefix DATABASE).
    url:
      process.env.DATABASE_URL ||
      process.env.DATABASE_TURSO_DATABASE_URL ||
      "file:./prisma/dev.db",
    authToken:
      process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
