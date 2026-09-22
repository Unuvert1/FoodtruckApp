"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Service" },
  { href: "/dashboard/menu", label: "Menu" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="mx-auto flex max-w-7xl gap-1 px-2">
      {LINKS.map((link) => {
        const active = link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-12 items-center px-3 text-[0.9375rem] font-semibold outline-none focus-visible:bg-muted",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
            {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-foreground" />}
          </Link>
        );
      })}
    </nav>
  );
}
