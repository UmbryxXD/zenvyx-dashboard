import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { appUrl, env } from "@/lib/env";
import { STATE_COOKIE, cookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = randomBytes(24).toString("base64url");
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", env("DISCORD_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${appUrl()}/api/auth/callback`);
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "none");
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, cookieOptions(600));
  return res;
}
