"use client";

import {
  startRegistration as runRegistration,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import { setPasskeyHint } from "@/data/passkeyHint";

export type PasskeyRow = { id: string; label: string | null; createdAt: Date };

export type AccountPageProps = {
  username: string;
  pendingRequestCount?: number;
  initialPasskeys?: PasskeyRow[];
  startAddPasskey: () => Promise<{
    challengeId: number;
    options: PublicKeyCredentialCreationOptionsJSON;
  }>;
  finishAddPasskey: (input: {
    challengeId: number;
    response: RegistrationResponseJSON;
    label?: string | null;
  }) => Promise<PasskeyRow>;
  removePasskey: (id: string) => Promise<{ error?: string } | void>;
  signOut?: () => Promise<void>;
};

const GENERIC_ERROR = "Something went wrong. Try again.";

function toClientPasskey(passkey: PasskeyRow): PasskeyRow {
  return { ...passkey, createdAt: new Date(passkey.createdAt) };
}

const AccountPage = function AccountPage({
  username,
  pendingRequestCount,
  initialPasskeys,
  startAddPasskey,
  finishAddPasskey,
  removePasskey,
  signOut,
}: AccountPageProps) {
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>(() =>
    (initialPasskeys ?? []).map(toClientPasskey),
  );
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAdd() {
    setAdding(true);
    try {
      const { challengeId, options } = await startAddPasskey();
      const response = await runRegistration({ optionsJSON: options });
      const added = await finishAddPasskey({ challengeId, response });
      setPasskeyHint();
      setPasskeys((current) => [...current, toClientPasskey(added)]);
      setErrorMessage(null);
    } catch {
      setErrorMessage(GENERIC_ERROR);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const result = await removePasskey(id);
      if (result && result.error) {
        setErrorMessage(result.error);
        return;
      }
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
      setErrorMessage(null);
    } catch {
      setErrorMessage(GENERIC_ERROR);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <PageTemplate
      username={username}
      pendingRequestCount={pendingRequestCount}
      onSignOut={signOut}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h2 className="text-lg font-semibold">Passkeys</h2>
        <p className="text-sm text-muted">
          Add a second passkey so you can not be locked out.
        </p>
        {errorMessage ? (
          <p className="text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {passkeys.map((passkey, index) => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span>
                {passkey.label ?? `Passkey ${index + 1}`}
                <span className="ml-2 text-sm text-muted">
                  {passkey.createdAt.toISOString().slice(0, 10)}
                </span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-11"
                aria-label={`Remove ${passkey.label ?? `Passkey ${index + 1}`}`}
                disabled={removingId === passkey.id}
                onClick={() => handleRemove(passkey.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          onClick={handleAdd}
          disabled={adding}
        >
          Add a passkey
        </Button>
      </div>
    </PageTemplate>
  );
};

export { AccountPage };
export default AccountPage;
