import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-2xl px-4 pt-4">
      <span className="sr-only">Loading your order…</span>
      <Skeleton className="h-10 w-32" />
      <Skeleton className="mt-3 h-10 w-52" />
      <Skeleton className="mt-3 h-4 w-3/4" />

      <Skeleton className="mt-10 h-7 w-20" />
      <Skeleton className="mt-3 h-32 w-full rounded-2xl" />

      <Skeleton className="mt-10 h-7 w-32" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>

      <Skeleton className="mt-10 h-7 w-36" />
      <Skeleton className="mt-3 h-40 w-full rounded-2xl" />
    </main>
  );
}
