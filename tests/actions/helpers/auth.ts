import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
  type KeyObject,
} from "node:crypto";
import { hashToken } from "@/actions/auth/tokens";
import { SESSION_COOKIE, origin, rpID } from "@/actions/auth/config";
import { startRegistration } from "@/actions/auth/startRegistration/startRegistration";
import { cookieJar } from "./cookieStore";
import { prisma } from "@/prisma/prismaClient";

// Creates a user with a live session and makes the mocked cookie() return it.
export async function signInAs(username: string) {
  const user = await prisma.user.create({ data: { username } });
  const token = randomBytes(32).toString("base64url");
  await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  cookieJar.set(SESSION_COOKIE, token);
  return user;
}

export function signOutCookie() {
  cookieJar.delete(SESSION_COOKIE);
}

// ---- Software authenticator (ES256, "none" attestation) ----

function cborHead(major: number, n: number) {
  if (n < 24) return Buffer.from([(major << 5) | n]);
  if (n < 256) return Buffer.from([(major << 5) | 24, n]);
  return Buffer.from([(major << 5) | 25, n >> 8, n & 0xff]);
}

type Cbor = number | string | Buffer | Map<Cbor, Cbor>;

function cbor(value: Cbor): Buffer {
  if (typeof value === "number") {
    return value >= 0 ? cborHead(0, value) : cborHead(1, -1 - value);
  }
  if (typeof value === "string") {
    const bytes = Buffer.from(value);
    return Buffer.concat([cborHead(3, bytes.length), bytes]);
  }
  if (Buffer.isBuffer(value)) {
    return Buffer.concat([cborHead(2, value.length), value]);
  }
  const parts: Buffer[] = [cborHead(5, value.size)];
  for (const [k, v] of value) parts.push(cbor(k), cbor(v));
  return Buffer.concat(parts);
}

const b64url = (buf: Buffer) => buf.toString("base64url");
const sha256 = (data: Buffer | string) =>
  createHash("sha256").update(data).digest();

export type SoftwareAuthenticator = ReturnType<typeof createAuthenticator>;

export function createAuthenticator() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const jwk = (publicKey as KeyObject).export({ format: "jwk" });
  const credentialId = randomBytes(16);
  const state = { counter: 0 };

  const coseKey = cbor(
    new Map<Cbor, Cbor>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, Buffer.from(jwk.x!, "base64url")],
      [-3, Buffer.from(jwk.y!, "base64url")],
    ]),
  );

  function counterBytes() {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(state.counter);
    return b;
  }

  function clientData(type: string, challenge: string, atOrigin: string) {
    return Buffer.from(
      JSON.stringify({ type, challenge, origin: atOrigin, crossOrigin: false }),
    );
  }

  return {
    id: b64url(credentialId),
    state,
    register(
      options: { challenge: string },
      atOrigin: string = origin,
    ) {
      const credIdLen = Buffer.alloc(2);
      credIdLen.writeUInt16BE(credentialId.length);
      const authData = Buffer.concat([
        sha256(rpID),
        Buffer.from([0x45]), // UP | UV | AT
        counterBytes(),
        Buffer.alloc(16), // aaguid
        credIdLen,
        credentialId,
        coseKey,
      ]);
      const attestationObject = cbor(
        new Map<Cbor, Cbor>([
          ["fmt", "none"],
          ["attStmt", new Map()],
          ["authData", authData],
        ]),
      );
      return {
        id: b64url(credentialId),
        rawId: b64url(credentialId),
        type: "public-key" as const,
        response: {
          clientDataJSON: b64url(
            clientData("webauthn.create", options.challenge, atOrigin),
          ),
          attestationObject: b64url(attestationObject),
          transports: ["internal" as const],
        },
        clientExtensionResults: {},
      };
    },
    assert(
      options: { challenge: string },
      { atOrigin = origin, counter }: { atOrigin?: string; counter?: number } = {},
    ) {
      state.counter = counter ?? state.counter + 1;
      const authData = Buffer.concat([
        sha256(rpID),
        Buffer.from([0x05]), // UP | UV
        counterBytes(),
      ]);
      const cd = clientData("webauthn.get", options.challenge, atOrigin);
      const signature = sign("sha256", Buffer.concat([authData, sha256(cd)]), privateKey);
      return {
        id: b64url(credentialId),
        rawId: b64url(credentialId),
        type: "public-key" as const,
        response: {
          clientDataJSON: b64url(cd),
          authenticatorData: b64url(authData),
          signature: b64url(signature),
        },
        clientExtensionResults: {},
      };
    },
  };
}

// startRegistration returns `{ error }` for user-facing failures; tests that expect success unwrap it here.
export async function beginRegistration(username: string) {
  const started = await startRegistration(username);
  if ("error" in started) throw new Error(started.error);
  return started;
}

// Creates users without touching the cookie; sign in with `switchTo`.
export async function createUsers(...usernames: string[]) {
  const users = [];
  for (const username of usernames) {
    users.push(await prisma.user.create({ data: { username } }));
  }
  return users;
}

export async function switchTo(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.authSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  cookieJar.set(SESSION_COOKIE, token);
}

// alice -> bob request, then bob accepts; leaves the cookie on alice.
export async function makeFriends() {
  const [alice, bob] = await createUsers("alice", "bob");
  const friendship = await prisma.friendship.create({
    data: { requesterId: alice.id, addresseeId: bob.id, status: "accepted" },
  });
  await switchTo(alice.id);
  return { alice, bob, friendship };
}
