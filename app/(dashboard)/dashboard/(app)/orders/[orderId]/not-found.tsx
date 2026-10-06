import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="mx-auto max-w-[40rem] px-4 py-12">
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em]">Order not found</h1>
      <p className="mt-3 text-muted-foreground">This order doesn&apos;t exist, or it belongs to another truck.</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-12 items-center rounded-xl border border-border px-5 font-semibold"
      >
        Back to Service
      </Link>
    </main>
  );
}
