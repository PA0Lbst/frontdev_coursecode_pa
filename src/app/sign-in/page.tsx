/*
 * Next.js App Router route for `/sign-in`.
 * Redirects signed-in users home and injects the passkey ceremony actions.
 */
import { redirect } from "next/navigation";
import { finishAuthentication } from "@/actions/auth/finishAuthentication/finishAuthentication";
import { finishRegistration } from "@/actions/auth/finishRegistration/finishRegistration";
import { getCurrentUser } from "@/actions/auth/getCurrentUser/getCurrentUser";
import { startAuthentication } from "@/actions/auth/startAuthentication/startAuthentication";
import { startRegistration } from "@/actions/auth/startRegistration/startRegistration";
import { SignInPage } from "@/components/pages/SignInPage/SignInPage";

export const dynamic = "force-dynamic";

export default async function SignInRoute({
  searchParams,
}: {
  searchParams: Promise<{ signedOut?: string }>;
}) {
  const { signedOut } = await searchParams;
  if (await getCurrentUser()) {
    redirect("/");
  }
  return (
    <SignInPage
      autoPrompt={!signedOut}
      startRegistration={startRegistration}
      finishRegistration={finishRegistration}
      startAuthentication={startAuthentication}
      finishAuthentication={finishAuthentication}
    />
  );
}
