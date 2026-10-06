import Link from "next/link";
import { StateScreen, stateLinkClass } from "@/components/storefront/state-screen";

// Catches every unknown URL, including a truck slug that doesn't exist.
export default function NotFound() {
  return (
    <StateScreen
      title="We can’t find that page"
      actions={
        <Link href="/" className={stateLinkClass}>
          Go to the home page
        </Link>
      }
    >
      <p>Check the link, or ask the truck for a fresh one.</p>
    </StateScreen>
  );
}
