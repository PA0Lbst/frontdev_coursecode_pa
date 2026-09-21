"use server";

import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { origin, rpID } from "@/actions/auth/config";
import { consumeChallenge, requireUser } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function finishAddPasskey(input: {
  challengeId: number;
  response: RegistrationResponseJSON;
  label?: string | null;
}) {
  const user = await requireUser();
  const challenge = await consumeChallenge(input.challengeId, "add");
  if (challenge.userId !== user.id) {
    throw new Error("Invalid challenge");
  }
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });
  if (!verification.verified) {
    throw new Error("Verification failed");
  }
  const { credential } = verification.registrationInfo;
  const label = input.label?.trim() || null;
  return prisma.passkey.create({
    data: {
      id: credential.id,
      userId: user.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports
        ? JSON.stringify(credential.transports)
        : null,
      label,
    },
    select: { id: true, label: true, createdAt: true },
  });
}
