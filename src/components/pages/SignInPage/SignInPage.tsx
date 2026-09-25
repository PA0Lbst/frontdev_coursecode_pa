"use client";

import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication as runAuthentication,
  startRegistration as runRegistration,
} from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import {
  clearPasskeyHint,
  hasPasskeyHint,
  setPasskeyHint,
} from "@/data/passkeyHint";
import { isValidUsername } from "@/data/username";

export type SignInPageProps = {
  // Open the OS passkey sheet on load when this browser has a passkey hint. Off after an explicit sign-out.
  autoPrompt?: boolean;
  startRegistration: (username: string) => Promise<
    | {
        challengeId: number;
        options: PublicKeyCredentialCreationOptionsJSON;
      }
    | { error: string }
  >;
  finishRegistration: (input: {
    challengeId: number;
    response: RegistrationResponseJSON;
  }) => Promise<unknown | { error: string }>;
  startAuthentication: () => Promise<{
    challengeId: number;
    options: PublicKeyCredentialRequestOptionsJSON;
  }>;
  finishAuthentication: (input: {
    challengeId: number;
    response: AuthenticationResponseJSON;
  }) => Promise<unknown>;
};

function hasError(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

const GENERIC_ERROR = "Something went wrong. Try again.";

const SignInPage = function SignInPage({
  autoPrompt = true,
  startRegistration,
  finishRegistration,
  startAuthentication,
  finishAuthentication,
}: SignInPageProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phase, setPhase] = useState<"checking" | "idle">("idle");
  const attempted = useRef(false);
  const [armAutofill, setArmAutofill] = useState(false);
  const autofillArmed = useRef(false);
  // Challenge of the pending autofill request. Safari can sign the next modal request
  // with it, so the button reuses it instead of asking for a new one.
  const autofillChallenge = useRef<{
    challengeId: number;
    options: PublicKeyCredentialRequestOptionsJSON;
    expiresAt: number;
  } | null>(null);
  const [pending, setPending] = useState<"register" | "sign-in" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Browsers never say whether a passkey exists without asking. Only open the sheet
  // when this browser has used one before; otherwise offer passkeys through autofill.
  useEffect(() => {
    if (attempted.current || !browserSupportsWebAuthn()) return;
    attempted.current = true;
    (async () => {
      if (!autoPrompt || !hasPasskeyHint()) {
        setArmAutofill(true);
        return;
      }
      setPhase("checking");
      try {
        const { challengeId, options } = await startAuthentication();
        const response = await runAuthentication({ optionsJSON: options });
        await finishAuthentication({ challengeId, response });
        setPasskeyHint();
        router.push("/");
      } catch {
        clearPasskeyHint();
        setPhase("idle");
        setArmAutofill(true);
      }
    })();
  }, [autoPrompt, startAuthentication, finishAuthentication, router]);

  // Runs once the forms are rendered: conditional mediation needs the webauthn input.
  useEffect(() => {
    if (!armAutofill || phase !== "idle" || autofillArmed.current) return;
    autofillArmed.current = true;
    (async () => {
      if (!(await browserSupportsWebAuthnAutofill())) return;
      let challengeId: number;
      let response: AuthenticationResponseJSON;
      try {
        const started = await startAuthentication();
        challengeId = started.challengeId;
        // Server challenges last 5 minutes; keep a margin.
        autofillChallenge.current = {
          ...started,
          expiresAt: Date.now() + 4 * 60 * 1000,
        };
        response = await runAuthentication({
          optionsJSON: started.options,
          useBrowserAutofill: true,
        });
      } catch {
        // Aborted by another ceremony, refused or timed out: the user did nothing, stay quiet.
        return;
      }
      autofillChallenge.current = null;
      try {
        await finishAuthentication({ challengeId, response });
        setPasskeyHint();
        router.push("/");
      } catch {
        setErrorMessage(GENERIC_ERROR);
      }
    })();
  }, [armAutofill, phase, startAuthentication, finishAuthentication, router]);

  function fail() {
    setErrorMessage(GENERIC_ERROR);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!browserSupportsWebAuthn()) {
      setErrorMessage("This browser does not support passkeys.");
      return;
    }
    if (!isValidUsername(username)) {
      setErrorMessage(
        "Use 3–20 characters: lowercase letters, numbers or underscores.",
      );
      return;
    }
    setPending("register");
    try {
      const started = await startRegistration(username);
      if ("error" in started) {
        setErrorMessage(started.error);
        return;
      }
      const response = await runRegistration({ optionsJSON: started.options });
      const finished = await finishRegistration({
        challengeId: started.challengeId,
        response,
      });
      if (hasError(finished)) {
        setErrorMessage(finished.error);
        return;
      }
      setPasskeyHint();
      router.push("/");
    } catch {
      fail();
    } finally {
      setPending(null);
    }
  }

  async function handleSignIn() {
    if (!browserSupportsWebAuthn()) {
      setErrorMessage("This browser does not support passkeys.");
      return;
    }
    setPending("sign-in");
    const reusable = autofillChallenge.current;
    autofillChallenge.current = null;
    try {
      const { challengeId, options } =
        reusable && reusable.expiresAt > Date.now()
          ? reusable
          : await startAuthentication();
      const response = await runAuthentication({ optionsJSON: options });
      await finishAuthentication({ challengeId, response });
      setPasskeyHint();
      router.push("/");
    } catch {
      fail();
    } finally {
      setPending(null);
    }
  }

  return (
    <PageTemplate>
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        {phase === "checking" ? (
          <p role="status">Looking for your passkey…</p>
        ) : (
          <>
            {errorMessage ? (
              <p className="text-danger" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <section>
              <form className="flex flex-col gap-3" onSubmit={handleRegister}>
                <h2 className="text-lg font-semibold">Create an account</h2>
                <label
                  className="text-sm font-medium"
                  htmlFor="sign-in-username"
                >
                  Username
                </label>
                <Input
                  id="sign-in-username"
                  className="min-h-11"
                  autoComplete="username webauthn"
                  autoCapitalize="none"
                  enterKeyHint="go"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-11 w-full"
                  disabled={pending !== null}
                >
                  Create account
                </Button>
              </form>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Already have a passkey?</h2>
              <Button
                variant="secondary"
                size="lg"
                className="min-h-11 w-full"
                onClick={handleSignIn}
                disabled={pending !== null}
              >
                Sign in with passkey
              </Button>
            </section>
          </>
        )}
      </div>
    </PageTemplate>
  );
};

export { SignInPage };
export default SignInPage;
