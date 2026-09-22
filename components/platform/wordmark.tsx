import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-2xl leading-none font-extrabold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
        className
      )}
    >
      FoodtruckApp
    </Link>
  );
}
