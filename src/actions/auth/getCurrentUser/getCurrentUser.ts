"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/actions/auth/config";
import { hashToken } from "@/actions/auth/tokens";
import { prisma } from "@/prisma/prismaClient";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  const { id, username, createdAt } = session.user;
  return { id, username, createdAt };
}
