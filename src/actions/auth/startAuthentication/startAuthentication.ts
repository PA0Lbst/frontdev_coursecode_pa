"use server";

import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpID } from "@/actions/auth/config";
import { storeChallenge } from "@/actions/auth/helpers";

export async function startAuthentication() {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });
  const challengeId = await storeChallenge({
    challenge: options.challenge,
    purpose: "authenticate",
  });
  return { challengeId, options };
}
