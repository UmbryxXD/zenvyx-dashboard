import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appUrl, env } from "@/lib/env";
import { STATE_COOKIE, cookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // The login cookie must be set on the same address Discord sends the user back to (APP_URL).
  // If the user started on another Vercel address, hop to APP_URL first (once).
  const wanted = new URL(appUrl());
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (host && host !== wanted.host && !req.nextUrl.searchParams.has("c")) {
    return NextResponse.redirect(`${wanted.origin}/api/auth/login?c=1`);
  }

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
