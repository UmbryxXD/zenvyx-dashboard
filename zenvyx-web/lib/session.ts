import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { env } from "./env";

export const SESSION_COOKIE = "zx_session";
export const STATE_COOKIE = "zx_state";
const SESSION_DAYS = 6; // Discord access tokens last 7 days

export type Session = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  accessToken: string;
};

const key = () => createHash("sha256").update(env("SESSION_SECRET")).digest();

export async function sealSession(session: Session): Promise<string> {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .encrypt(key());
}

export async function getSession(): Promise<Session | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtDecrypt(raw, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSeconds,
});
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
