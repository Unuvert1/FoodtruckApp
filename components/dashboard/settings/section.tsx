import { cn } from "@/lib/utils";

/**
 * The card every settings page uses: a header block, then hairline-separated
 * rows. Hairlines instead of nested boxes, and no shadow.
 */
export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("max-w-2xl rounded-2xl bg-surface", className)}>
      <header className="px-5 pt-5 pb-4">
        <h2 className="text-[1.25rem] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
}
