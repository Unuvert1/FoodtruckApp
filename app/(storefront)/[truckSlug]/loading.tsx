import { Skeleton } from "@/components/ui/skeleton";

// Shown while the storefront loads (the page is dynamic, so this appears on
// every visit and on every "pick another stop" click). Shaped like the real
// page: hero, stop list, menu rows.
export default function StorefrontLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading the menu…</span>

      <div className="bg-brand/90 pb-12">
        <div className="mx-auto max-w-2xl px-4 pt-14">
          <Skeleton className="h-5 w-32 bg-brand-foreground/20" />
          <Skeleton className="mt-4 h-20 w-4/5 bg-brand-foreground/20" />
          <Skeleton className="mt-4 h-8 w-48 bg-brand-foreground/20" />
          <Skeleton className="mt-8 h-12 w-full bg-brand-foreground/20 sm:w-48" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-4 h-40 w-full rounded-2xl" />

        <Skeleton className="mt-10 h-8 w-24" />
        <Skeleton className="mt-4 h-9 w-full rounded-full" />
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl bg-surface">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="size-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
