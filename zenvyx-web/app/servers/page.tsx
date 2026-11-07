import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { bot, BotError } from "@/lib/bot";
import { env } from "@/lib/env";
import { avatarUrl, number } from "@/lib/format";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type DiscordGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };
type Mutual = { id: string; name: string; icon: string | null; member_count: number };

// Convenience filter only. The bot re-checks real permissions before showing anything.
const MANAGE = BigInt(0x28); // Administrator | Manage Server

const guildIcon = (g: { id: string; icon: string | null }) =>
  g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;

const Initial = ({ name }: { name: string }) => (
  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700 font-display text-lg text-zen-300">{name.slice(0, 1)}</span>
);

export default async function Servers() {
  const session = await getSession();
  if (!session) redirect("/");

  let candidates: DiscordGuild[] = [];
  let problem: string | null = null;
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/api/auth/login");
  if (res.ok) {
    const all = (await res.json()) as DiscordGuild[];
    candidates = all.filter((g) => g.owner || (BigInt(g.permissions) & MANAGE) !== BigInt(0));
  } else {
    problem = "Discord is rate-limiting us. Refresh in a few seconds.";
  }

  let withBot = new Map<string, Mutual>();
  if (candidates.length) {
    try {
      const data = await bot<{ guilds: Mutual[] }>("/v1/guilds/mutual", session.id, {
        method: "POST",
        body: { guild_ids: candidates.map((g) => g.id) },
      });
      withBot = new Map(data.guilds.map((g) => [g.id, g]));
    } catch (e) {
      problem = e instanceof BotError ? e.message : "Could not load servers.";
    }
  }

  const clientId = env("DISCORD_CLIENT_ID");
  const invite = (id: string) =>
    `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${id}&disable_guild_select=true`;
  const ready = candidates.filter((g) => withBot.has(g.id));
  const missing = candidates.filter((g) => !withBot.has(g.id));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(session.id, session.avatar)} alt="" className="h-8 w-8 rounded-full" />
          <span className="hidden text-sm text-zinc-300 sm:block">{session.name}</span>
          <form action="/api/auth/logout" method="post"><button className="btn-ghost !py-1.5">Log out</button></form>
        </div>
      </header>

      <h1 className="rise mt-10 font-display text-2xl font-semibold text-white">Select a server</h1>
      <p className="mt-1 text-sm text-zinc-400">Only servers where you have Administrator or Manage Server are shown.</p>

      {problem && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{problem}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ready.map((g, i) => {
          const m = withBot.get(g.id)!;
          const icon = guildIcon(m);
          return (
            <a key={g.id} href={`/dashboard/${g.id}`} style={{ animationDelay: `${i * 40}ms` }}
               className="glass rise group flex items-center gap-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-zen-400/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-12 w-12 rounded-2xl" /> : <Initial name={m.name} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{m.name}</span>
                <span className="text-xs text-zinc-500">{number(m.member_count)} members</span>
              </span>
              <span className="text-sm text-zen-400 transition group-hover:translate-x-0.5">Open →</span>
            </a>
          );
        })}
        {missing.map((g) => {
          const icon = guildIcon(g);
          return (
            <div key={g.id} className="glass flex items-center gap-4 p-4 opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-12 w-12 rounded-2xl grayscale" /> : <Initial name={g.name} />}
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-300">{g.name}</span>
              <a href={invite(g.id)} className="btn-ghost !px-3 !py-1.5 text-xs">Add bot</a>
            </div>
          );
        })}
      </div>

      {!problem && candidates.length === 0 && (
        <p className="mt-10 text-center text-sm text-zinc-500">You don&apos;t manage any servers yet.</p>
      )}
    </main>
  );
}
