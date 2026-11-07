import { Logo } from "./Logo";

const ITEMS = [
  { label: "Overview", href: "", live: true },
  { label: "Server settings", live: false },
  { label: "Moderation", live: false },
  { label: "AI", live: false },
  { label: "Music", live: false },
  { label: "Blox Fruits", live: false },
  { label: "Appeals & reports", live: false },
  { label: "Logs", live: false },
];

export function Sidebar({ guildId }: { guildId: string }) {
  return (
    <aside className="md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
        <Logo />
        <a href="/servers" className="text-xs text-zinc-400 hover:text-zen-300 md:hidden">Servers</a>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3" aria-label="Dashboard sections">
        {ITEMS.map((item) =>
          item.live ? (
            <a key={item.label} href={`/dashboard/${guildId}${item.href}`} aria-current="page"
               className="whitespace-nowrap rounded-xl bg-zen-600/20 px-3 py-2 text-sm font-medium text-zen-300">
              {item.label}
            </a>
          ) : (
            <span key={item.label} className="flex cursor-not-allowed items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-zinc-600">
              {item.label}
              <span className="hidden rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide md:inline">Soon</span>
            </span>
          ),
        )}
      </nav>
      <a href="/servers" className="mx-5 mt-4 hidden text-sm text-zinc-400 hover:text-zen-300 md:block">← Switch server</a>
    </aside>
  );
}
