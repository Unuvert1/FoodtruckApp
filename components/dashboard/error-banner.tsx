import { cn } from "@/lib/utils";

/** A failed dashboard action, shown above the thing it was about. Renders nothing without a message. */
export function ErrorBanner({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn("rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive", className)}>
      {message}
    </p>
  );
}
