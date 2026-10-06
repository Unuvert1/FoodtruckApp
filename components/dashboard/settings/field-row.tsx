import { cn } from "@/lib/utils";

/** Label on the left, control on the right from `md` up; stacked below that. */
export function FieldRow({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-5 py-4 md:flex-row md:gap-4", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground md:w-44 md:shrink-0 md:pt-3.5">
        {label}
      </label>
      <div className="min-w-0 flex-1">
        {children}
        {hint && <div className="mt-1.5 text-sm text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

/** The input styling every settings form shares. */
export const inputClass = "h-12 rounded-xl px-3.5 text-base";
