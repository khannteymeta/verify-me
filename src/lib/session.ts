import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { redis } from "@/lib/redis";
import { getUserById } from "@/lib/users";
import type { Channel } from "@/lib/validation";

export const SESSION_COOKIE = "sid";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const PENDING_COOKIE = "vm_pending";
const PENDING_TTL = 300; // matches the code timeout sent to Verifyme

const secure = process.env.NODE_ENV === "production";

const newId = () => randomBytes(32).toString("base64url");
// Only a hash of the cookie value is stored, so a Redis dump can't be replayed.
const hash = (v: string) => createHash("sha256").update(v).digest("hex");

// ---------------------------------------------------------------------------
// Session (signed-in user)
// ---------------------------------------------------------------------------

type SessionData = { userId: string; createdAt: string };

export async function createSession(userId: string) {
  const sid = newId();
  const data: SessionData = { userId, createdAt: new Date().toISOString() };
  await redis.set(`sess:${hash(sid)}`, JSON.stringify(data), "EX", SESSION_TTL);

  (await cookies()).set(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const raw = await redis.get(`sess:${hash(sid)}`);
  return raw ? (JSON.parse(raw) as SessionData) : null;
}

export async function destroySession() {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (sid) await redis.del(`sess:${hash(sid)}`);
  store.delete(SESSION_COOKIE);
}

/** Current user, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return getUserById(session.userId);
});

// ---------------------------------------------------------------------------
// Pending verification (between "send code" and "enter code")
// The Verifyme token is a credential — it lives in Redis, never in the browser.
// ---------------------------------------------------------------------------

/** What the code is for: signing in, or creating an account with this name. */
export type PendingPurpose = { kind: "login" } | { kind: "register"; name: string };

// `purpose` is optional so codes sent before it existed still verify (as login).
type PendingData = { token: string; target: string; channel: Channel; purpose?: PendingPurpose };

export async function savePending(data: PendingData) {
  const id = newId();
  await redis.set(`pending:${hash(id)}`, JSON.stringify(data), "EX", PENDING_TTL);
  (await cookies()).set(PENDING_COOKIE, id, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: PENDING_TTL,
  });
}

export async function getPending(): Promise<PendingData | null> {
  const id = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!id) return null;
  const raw = await redis.get(`pending:${hash(id)}`);
  return raw ? (JSON.parse(raw) as PendingData) : null;
}

export async function clearPending() {
  const store = await cookies();
  const id = store.get(PENDING_COOKIE)?.value;
  if (id) await redis.del(`pending:${hash(id)}`);
  store.delete({ name: PENDING_COOKIE, path: "/api/auth" });
}
