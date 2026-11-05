import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Wordmark } from "@/components/platform/wordmark";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "Questions" },
  { href: "/blog", label: "Writing" },
];

/** Signed-out sees Log in; signed-in (or the dev bypass) goes straight to the dashboard. */
function AccountLink({ className }: { className?: string }) {
  if (DEV_AUTH_BYPASS) {
    return (
      <Link href="/dashboard" className={className}>
        Open dashboard
      </Link>
    );
  }
  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in" className={className}>
          Log in
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={className}>
          Open dashboard
        </Link>
      </Show>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
      <Wordmark />

      <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={navLink}>
            {link.label}
          </Link>
        ))}
        <AccountLink className={`${navLink} ml-1`} />
        <Link
          href="/sign-up"
          className="ml-2 inline-flex h-10 items-center rounded-full bg-foreground px-4.5 text-sm font-semibold text-background outline-none hover:bg-foreground/90 focus-visible:ring-4 focus-visible:ring-foreground/25"
        >
          Set up your truck
        </Link>
      </nav>

      {/* Phone: a disclosure, so the menu needs no JavaScript to open. */}
      <details className="relative sm:hidden [&[open]_.menu-closed]:hidden [&:not([open])_.menu-open]:hidden">
        <summary className="flex h-11 cursor-pointer list-none items-center rounded-lg px-3 text-sm font-semibold outline-none select-none focus-visible:ring-2 focus-visible:ring-foreground/40">
          <span className="menu-closed">Menu</span>
          <span className="menu-open">Close</span>
        </summary>
        <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-2xl border border-border bg-popover py-1 shadow-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="block px-4 py-3 text-[0.9375rem] font-medium hover:bg-muted">
              {link.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-border pt-1">
            <AccountLink className="block px-4 py-3 text-[0.9375rem] font-semibold hover:bg-muted" />
            <Link href="/sign-up" className="block px-4 py-3 text-[0.9375rem] font-semibold hover:bg-muted">
              Set up your truck
            </Link>
          </div>
        </div>
      </details>
      </div>
    </header>
  );
}

const navLink =
  "rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground/40";
