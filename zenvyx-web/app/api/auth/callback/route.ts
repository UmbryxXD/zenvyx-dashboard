import { NextRequest, NextResponse } from "next/server";
import { appUrl, env } from "@/lib/env";
import { SESSION_COOKIE, SESSION_MAX_AGE, STATE_COOKIE, cookieOptions, sealSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${appUrl()}/?error=${reason}`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get(STATE_COOKIE)?.value;
  if (req.nextUrl.searchParams.get("error")) return fail("cancelled");
  if (!code || !state || !saved || state !== saved) return fail("state");

  try {
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env("DISCORD_CLIENT_ID"),
        client_secret: env("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl()}/api/auth/callback`,
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) return fail("discord");
    const token = (await tokenRes.json()) as { access_token: string };

    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!meRes.ok) return fail("discord");
    const me = (await meRes.json()) as { id: string; username: string; global_name?: string; avatar?: string | null };

    const sealed = await sealSession({
      id: me.id,
      username: me.username,
      name: me.global_name || me.username,
      avatar: me.avatar ?? null,
      accessToken: token.access_token,
    });
    const res = NextResponse.redirect(`${appUrl()}/servers`);
    res.cookies.set(SESSION_COOKIE, sealed, cookieOptions(SESSION_MAX_AGE));
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch {
    return fail("server");
  }
}
