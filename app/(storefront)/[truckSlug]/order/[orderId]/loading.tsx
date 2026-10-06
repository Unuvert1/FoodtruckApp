import { Skeleton } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <main role="status" aria-busy="true" className="mx-auto max-w-2xl pb-16">
      <span className="sr-only">Loading your order…</span>

      <div className="bg-brand/90 px-4 pt-8 pb-8 sm:rounded-b-3xl">
        <Skeleton className="h-6 w-36 bg-brand-foreground/20" />
        <Skeleton className="mt-8 h-5 w-64 bg-brand-foreground/20" />
        <Skeleton className="mt-3 h-24 w-48 bg-brand-foreground/20" />
      </div>

      <div className="px-4 pt-8">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
        <Skeleton className="mt-8 h-7 w-24" />
        <Skeleton className="mt-3 h-44 w-full rounded-2xl" />
      </div>
    </main>
  );
}
