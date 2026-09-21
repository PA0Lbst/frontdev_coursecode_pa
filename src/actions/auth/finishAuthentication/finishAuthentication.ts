"use server";

import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
} from "@simplewebauthn/server";
import { origin, rpID } from "@/actions/auth/config";
import { consumeChallenge, createSessionCookie } from "@/actions/auth/helpers";
import { prisma } from "@/prisma/prismaClient";

export async function finishAuthentication(input: {
  challengeId: number;
  response: AuthenticationResponseJSON;
}) {
  const challenge = await consumeChallenge(input.challengeId, "authenticate");
  const passkey = await prisma.passkey.findUnique({
    where: { id: input.response.id },
    include: { user: true },
  });
  if (!passkey) {
    throw new Error("Invalid credentials");
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransport[])
          : undefined,
      },
    });
  } catch {
    throw new Error("Invalid credentials");
  }
  if (!verification.verified) {
    throw new Error("Invalid credentials");
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: verification.authenticationInfo.newCounter },
  });
  await createSessionCookie(passkey.userId);
  return { id: passkey.user.id, username: passkey.user.username };
}
