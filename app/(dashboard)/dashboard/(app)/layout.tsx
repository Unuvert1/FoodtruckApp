import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ExternalLink } from "lucide-react";
import { requireTruckAccess } from "@/lib/tenant";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { truck } = await requireTruckAccess();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-3">
          <p className="min-w-0 flex-1 truncate font-display text-2xl leading-tight font-extrabold">{truck.name}</p>
          <Link
            href={`/${truck.slug}`}
            target="_blank"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="hidden sm:inline">Ordering page</span>
            <ExternalLink aria-label="Open your ordering page" className="size-4" />
          </Link>
          {DEV_AUTH_BYPASS ? (
            <span
              title="Login is off (DEV_AUTH_BYPASS in .env.local)"
              className="inline-flex h-8 items-center rounded-full bg-signal px-3 text-xs font-bold text-signal-foreground"
            >
              Demo mode
            </span>
          ) : (
            <UserButton />
          )}
        </div>
        <DashboardNav />
      </header>
      {children}
    </div>
  );
}
