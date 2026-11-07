import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: { guildId: string } }) {
  if (!(await getSession())) redirect("/");
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
      <Sidebar guildId={params.guildId} />
      <main className="min-w-0 flex-1 px-4 pb-12 pt-4 md:px-10 md:pt-10">{children}</main>
    </div>
  );
}
