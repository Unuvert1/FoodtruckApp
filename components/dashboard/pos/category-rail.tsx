"use client";

import { cn } from "@/lib/utils";

type Props = {
  sections: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function CategoryRail({ sections, selectedId, onSelect }: Props) {
  return (
    <div
      role="group"
      aria-label="Menu sections"
      className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 md:flex-wrap md:overflow-visible"
    >
      {sections.map((s) => {
        const selected = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(s.id)}
            className={cn(
              "h-11 shrink-0 rounded-full px-5 text-[0.9375rem] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-foreground/30",
              selected ? "bg-foreground text-background" : "border border-border bg-surface text-foreground"
            )}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
