"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GROUP_LABELS, sectionsFor, type SettingsGroup } from "@/lib/settings-sections";
import { cn } from "@/lib/utils";

type Role = "OWNER" | "STAFF";

function SectionList({ role, tall, onNavigate }: { role: Role; tall?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = sectionsFor(role);
  const groups = (Object.keys(GROUP_LABELS) as SettingsGroup[]).filter((g) => sections.some((s) => s.group === g));

  return (
    <>
      {groups.map((group, index) => (
        <div key={group}>
          <p
            className={cn(
              "px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase",
              index === 0 ? "pt-0" : "pt-5"
            )}
          >
            {GROUP_LABELS[group]}
          </p>
          <ul>
            {sections
              .filter((s) => s.group === group)
              .map((section) => {
                const active = pathname === section.href;
                return (
                  <li key={section.href}>
                    <Link
                      href={section.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center rounded-lg px-3 text-[0.9375rem] tracking-[-0.01em] outline-none focus-visible:bg-muted",
                        tall ? "h-12" : "h-11",
                        active ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {section.label}
                      {active && <span aria-hidden className="absolute inset-y-1.5 right-0 w-0.5 rounded-full bg-brand" />}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </>
  );
}

/**
 * Desktop: a sticky list beside the page. Phone: one button showing the current
 * section that opens the same list in a sheet. The side of the page the rail
 * sits on is decided by the layout, not here.
 */
export function SettingsRail({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = sectionsFor(role).find((s) => s.href === pathname);

  return (
    <>
      <nav aria-label="Settings" className="hidden w-[13.75rem] shrink-0 md:block">
        <SectionList role={role} />
      </nav>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Choose a settings section"
          className="flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-surface px-3.5 text-left text-[0.9375rem] font-semibold tracking-[-0.01em] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Menu aria-hidden className="size-4.5 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{current?.label ?? "Settings"}</span>
          <ChevronDown aria-hidden className="size-4.5 text-muted-foreground" />
        </button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="gap-0 bg-surface p-0 shadow-none">
            <div className="px-5 pt-5 pb-4">
              <SheetTitle className="text-base font-semibold tracking-[-0.01em]">Settings</SheetTitle>
            </div>
            <nav aria-label="Settings sections" className="overflow-y-auto px-2 pb-6">
              <SectionList role={role} tall onNavigate={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
