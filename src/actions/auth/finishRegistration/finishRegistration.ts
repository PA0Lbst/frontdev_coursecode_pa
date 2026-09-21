"use server";

import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { USERNAME_TAKEN, origin, rpID } from "@/actions/auth/config";
import { consumeChallenge, createSessionCookie } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function finishRegistration(input: {
  challengeId: number;
  response: RegistrationResponseJSON;
}) {
  const challenge = await consumeChallenge(input.challengeId, "register");
  const username = challenge.username;
  if (!username) {
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

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username,
        passkeys: {
          create: {
            id: credential.id,
            publicKey: Buffer.from(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports
              ? JSON.stringify(credential.transports)
              : null,
          },
        },
      },
    });
  } catch {
    return { error: USERNAME_TAKEN };
  }
  await createSessionCookie(user.id);
  return { id: user.id, username: user.username };
}
