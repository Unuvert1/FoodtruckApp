import type { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode; // the explanation
  actions?: ReactNode; // links or buttons under it
};

/**
 * A full-page message for the in-between moments: nothing found, something
 * broke, nothing to show yet. Same look as the "ordering isn't open" screens,
 * so a customer never lands on a blank page.
 */
export function StateScreen({ title, children, actions }: Props) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      {children && <div className="mt-3 text-muted-foreground">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">{actions}</div>}
    </main>
  );
}

/** Inline link styled like the other "go back" links on the storefront. */
export const stateLinkClass =
  "inline-block font-semibold text-brand underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";
