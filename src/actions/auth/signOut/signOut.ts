"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/actions/auth/config";
import { hashToken } from "@/actions/auth/tokens";
import { prisma } from "@/prisma/prismaClient";

export async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
    store.delete(SESSION_COOKIE);
  }
  redirect("/sign-in?signedOut=1");
}
