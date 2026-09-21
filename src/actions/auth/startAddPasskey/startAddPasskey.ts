"use server";

import { generateRegistrationOptions } from "@simplewebauthn/server";
import { rpID, rpName } from "@/actions/auth/config";
import { requireUser, storeChallenge } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function startAddPasskey() {
  const user = await requireUser();
  const existing = await prisma.passkey.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.username,
    attestationType: "none",
    excludeCredentials: existing.map(({ id }) => ({ id })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });
  const challengeId = await storeChallenge({
    challenge: options.challenge,
    purpose: "add",
    userId: user.id,
  });
  return { challengeId, options };
}
