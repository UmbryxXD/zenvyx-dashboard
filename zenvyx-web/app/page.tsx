import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/session";

const ERRORS: Record<string, string> = {
  cancelled: "Login was cancelled.",
  state: "Your login session expired. Please try again.",
  discord: "Discord refused the login. Check the client ID/secret and redirect URL.",
  server: "Something went wrong while signing you in.",
};

export default async function Home({ searchParams }: { searchParams: { error?: string } }) {
  if (await getSession()) redirect("/servers");
  const error = searchParams.error ? ERRORS[searchParams.error] || ERRORS.server : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
      <div className="glass rise w-full p-8 text-center">
        <div className="mb-6 flex justify-center"><Logo size={36} /></div>
        <h1 className="font-display text-2xl font-semibold text-white">Manage your servers</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign in with Discord to configure Zenvyx without typing a single command.</p>
        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
        )}
        <a href="/api/auth/login" className="btn-primary mt-6 w-full">Continue with Discord</a>
        <p className="mt-4 text-xs text-zinc-500">We only read your name, avatar and server list.</p>
      </div>
    </main>
  );
}
