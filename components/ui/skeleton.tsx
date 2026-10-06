import { cn } from "@/lib/utils";

/** A grey placeholder block for loading screens. Only pulses when the visitor allows motion. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn("rounded-xl bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
