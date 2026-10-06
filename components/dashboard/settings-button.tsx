"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Settings lives in the header rather than the tab bar: the tabs are the three
 * screens a vendor works in during a service, and settings is not one of them.
 */
export function SettingsButton() {
  const active = usePathname().startsWith("/dashboard/settings");

  return (
    <Link
      href="/dashboard/settings"
      aria-label="Settings"
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Settings className="size-5" strokeWidth={1.75} />
    </Link>
  );
}
