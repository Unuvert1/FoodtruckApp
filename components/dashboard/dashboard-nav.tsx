"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Service" },
  { href: "/dashboard/pos", label: "POS" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/schedule", label: "Schedule" },
];

const POLL_MS = 12_000;

/**
 * The Service tab pulses while an order is waiting to be accepted, so a vendor
 * ringing someone up on POS still sees one arrive. The Service screen does its
 * own polling; this is for every other page.
 */
function useWaitingOrders() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/dashboard/new-orders", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setCount(typeof data.count === "number" ? data.count : 0);
      } catch {
        // Offline or mid-deploy: keep the last count rather than clearing the cue.
      }
    }

    void load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pathname]);

  return count;
}

export function DashboardNav() {
  const pathname = usePathname();
  const waiting = useWaitingOrders();

  return (
    <nav aria-label="Dashboard" className="mx-auto flex max-w-7xl gap-1 px-2">
      {LINKS.map((link) => {
        const active = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
        const alerting = link.href === "/dashboard" && waiting > 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-12 items-center gap-2 rounded-t-lg px-3 text-[0.9375rem] font-semibold outline-none focus-visible:bg-muted",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              // Reduced motion keeps the peak colour as a steady state, so the
              // cue is never carried by the animation alone.
              alerting && "bg-new-pulse-peak text-foreground motion-safe:bg-new-tint motion-safe:animate-tab-pulse"
            )}
          >
            {link.label}
            {alerting && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-new px-1.5 text-xs font-bold text-new-foreground tabular-nums">
                {waiting}
              </span>
            )}
            {alerting && <span className="sr-only">{waiting} waiting to be accepted</span>}
            {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-foreground" />}
          </Link>
        );
      })}
    </nav>
  );
}
