"use server";

import { LAST_PASSKEY } from "@/actions/auth/config";
import { requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function removePasskey(id: string) {
  const user = await requireUser();
  const passkeys = await prisma.passkey.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!passkeys.some((passkey) => passkey.id === id)) {
    throw new Error("Not found");
  }
  if (passkeys.length === 1) {
    return { error: LAST_PASSKEY };
  }
  await prisma.passkey.delete({ where: { id } });
  return {};
}
