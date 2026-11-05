import Link from "next/link";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "Questions" },
      { href: "/demo-truck", label: "Demo storefront" },
      { href: "/sign-up", label: "Set up your truck" },
    ],
  },
  {
    heading: "Writing",
    links: [
      { href: "/blog", label: "All posts" },
      { href: "/blog/why-not-restaurant-software", label: "Why not restaurant software" },
      { href: "/blog/pickup-times-that-cant-overbook", label: "Pickup times that can't overbook" },
    ],
  },
  {
    heading: "Legal",
    links: [{ href: "/legal", label: "Terms and privacy" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-2xl leading-none font-extrabold tracking-tight">FoodtruckApp</p>
            <p className="mt-3 max-w-[22rem] text-sm leading-relaxed text-muted-foreground">
              Preorders for a kitchen that moves. Built as a class project by two developers, and honest about
              what is finished.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold">{column.heading}</h2>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-foreground/40"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} FoodtruckApp. Not a real company.
        </p>
      </div>
    </footer>
  );
}
