import Link from "next/link";
import { Check } from "lucide-react";
import type { SetupProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The three things between a new truck and its first order. Each one is checked
 * against the database rather than ticked off by hand, so it can't disagree
 * with reality, and the whole thing stops rendering once they're all true.
 */
export function SetupChecklist({ progress, truckSlug }: { progress: SetupProgress; truckSlug: string }) {
  const { hasMenu, hasStop, hasOrder } = progress;
  if (hasMenu && hasStop && hasOrder) return null;

  const steps = [
    {
      done: hasMenu,
      title: "Add a dish",
      body: "Your menu is what customers order from.",
      href: "/dashboard/menu",
      action: "Open Menu",
    },
    {
      done: hasStop,
      title: "Schedule a stop",
      body: "Where you'll be and when. Set it to repeat and your week fills itself in.",
      href: "/dashboard/schedule",
      action: "Open Schedule",
    },
    {
      done: hasOrder,
      title: "Take your first order",
      body: "Share your ordering page, or ring one up at the window on the POS.",
      href: `/${truckSlug}`,
      action: "View your page",
    },
  ];

  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <section aria-labelledby="setup-heading" className="overflow-hidden rounded-2xl bg-surface">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-4 pb-3">
        <h2 id="setup-heading" className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
          Finish setting up
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">{done} of 3</p>
      </div>

      <ol className="divide-y divide-border border-t border-border">
        {steps.map((step) => (
          <li key={step.title} className="flex items-start gap-3.5 px-5 py-3.5">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                step.done ? "border-transparent bg-ok text-white" : "border-input"
              )}
            >
              {step.done && <Check className="size-3.5" strokeWidth={3} />}
            </span>

            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold", step.done && "text-muted-foreground line-through")}>
                {step.title}
                <span className="sr-only">{step.done ? " — done" : ""}</span>
              </p>
              {!step.done && <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>}
            </div>

            {step === next && (
              <Link
                href={step.href}
                className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background outline-none hover:bg-foreground/90 focus-visible:ring-4 focus-visible:ring-foreground/25"
              >
                {step.action}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
