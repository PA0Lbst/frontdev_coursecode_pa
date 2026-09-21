import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { hashToken } from "@/actions/auth/tokens";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import {
  CHALLENGE_MINUTES,
  SESSION_COOKIE,
  SESSION_DAYS,
} from "@/actions/auth/config";
import { prisma } from "@/prisma/prismaClient";

export async function createSessionCookie(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function storeChallenge(data: {
  challenge: string;
  purpose: "register" | "authenticate" | "add";
  username?: string;
  userId?: number;
}) {
  const row = await prisma.authChallenge.create({
    data: {
      ...data,
      expiresAt: new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000),
    },
  });
  return row.id;
}

// Single use: the row is deleted even if verification fails afterwards.
export async function consumeChallenge(
  id: number,
  purpose: "register" | "authenticate" | "add",
) {
  const row = await prisma.authChallenge.findUnique({ where: { id } });
  if (!row) {
    throw new Error("Invalid challenge");
  }
  await prisma.authChallenge.delete({ where: { id } });
  if (row.purpose !== purpose || row.expiresAt < new Date()) {
    throw new Error("Invalid challenge");
  }
  return row;
}
