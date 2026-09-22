import { cn } from "@/lib/utils";

export function Badge({ tone, children }: { tone: "signal" | "muted" | "ready"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs font-bold tabular-nums",
        tone === "signal" && "bg-signal text-signal-foreground",
        tone === "muted" && "bg-foreground/10 text-foreground",
        tone === "ready" && "bg-ready text-white"
      )}
    >
      {children}
    </span>
  );
}
