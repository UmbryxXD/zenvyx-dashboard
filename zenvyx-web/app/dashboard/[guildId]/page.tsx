import { redirect } from "next/navigation";
import { bot, BotError } from "@/lib/bot";
import { number, uptime } from "@/lib/format";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Overview = {
  guild: { id: string; name: string; icon: string | null; member_count: number; text_channels: number; voice_channels: number; categories: number; roles: number; boosts: number };
  bot: { latency_ms: number | null; uptime_seconds: number; guild_count: number; command_count: number; module_count: number };
  prefix: string | null;
  modules: { name: string; commands: number }[];
};

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="glass p-5">
    <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
  </div>
);

export default async function Page({ params }: { params: { guildId: string } }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (!/^\d{5,25}$/.test(params.guildId)) redirect("/servers");

  let data: Overview;
  try {
    data = await bot<Overview>(`/v1/guilds/${params.guildId}/overview`, session.id);
  } catch (e) {
    const err = e instanceof BotError ? e : new BotError(500, "Could not load this server.");
    return (
      <div className="glass mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-white">{err.status === 403 ? "No access" : "Couldn't load server"}</h1>
        <p className="mt-2 text-sm text-zinc-400">{err.message}</p>
        <a href="/servers" className="btn-ghost mt-6">Back to servers</a>
      </div>
    );
  }

  const { guild, bot: b } = data;
  return (
    <div className="rise space-y-8">
      <header className="flex items-center gap-4">
        {guild.icon && /* eslint-disable-next-line @next/next/no-img-element */ <img src={guild.icon} alt="" className="h-14 w-14 rounded-2xl" />}
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-white">{guild.name}</h1>
          <p className="text-sm text-zinc-400">Server overview{data.prefix ? <> · prefix <code className="rounded bg-white/10 px-1.5 py-0.5 text-zen-300">{data.prefix}</code></> : null}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Bot online
        </span>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Server stats">
        <Stat label="Members" value={number(guild.member_count)} />
        <Stat label="Channels" value={number(guild.text_channels + guild.voice_channels)} hint={`${guild.text_channels} text · ${guild.voice_channels} voice`} />
        <Stat label="Roles" value={number(guild.roles)} />
        <Stat label="Boosts" value={number(guild.boosts)} />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Bot status">
        <Stat label="Uptime" value={uptime(b.uptime_seconds)} />
        <Stat label="Latency" value={b.latency_ms === null ? "—" : `${b.latency_ms} ms`} />
        <Stat label="Commands" value={number(b.command_count)} />
        <Stat label="Servers" value={number(b.guild_count)} hint="where Zenvyx is added" />
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-white">Loaded modules <span className="text-sm font-normal text-zinc-500">({b.module_count})</span></h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.modules.map((m) => (
            <span key={m.name} className="glass px-3 py-1.5 text-sm text-zinc-300">
              {m.name} <span className="text-zinc-500">· {m.commands}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
