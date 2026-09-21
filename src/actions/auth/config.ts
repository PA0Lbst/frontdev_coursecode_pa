const vercelEnv = process.env.VERCEL_ENV;
const vercelHost =
  vercelEnv === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : vercelEnv === "preview"
      ? process.env.VERCEL_URL
      : undefined;

export const rpID = process.env.WEBAUTHN_RP_ID ?? vercelHost ?? "localhost";
export const origin =
  process.env.WEBAUTHN_ORIGIN ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
export const rpName = "Workoutish";
// Returned (not thrown): Next redacts thrown Server Action errors in production.
export const USERNAME_TAKEN = "That username is taken.";
export const LAST_PASSKEY = "You need at least one passkey.";
export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 30;
export const CHALLENGE_MINUTES = 5;
