"use server";

import { generateRegistrationOptions } from "@simplewebauthn/server";
import { rpID, rpName } from "@/actions/auth/config";
import { USERNAME_TAKEN } from "@/actions/auth/config";
import { storeChallenge } from "@/actions/auth/helpers";
import { isValidUsername, normalizeUsername } from "@/data/username";
import { prisma } from "@/prisma/prismaClient";

export async function startRegistration(username: string) {
  if (!isValidUsername(username)) {
    throw new Error("Invalid username");
  }
  const name = normalizeUsername(username);
  if (await prisma.user.findUnique({ where: { username: name } })) {
    return { error: USERNAME_TAKEN };
  }
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: name,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });
  const challengeId = await storeChallenge({
    challenge: options.challenge,
    purpose: "register",
    username: name,
  });
  return { challengeId, options };
}
