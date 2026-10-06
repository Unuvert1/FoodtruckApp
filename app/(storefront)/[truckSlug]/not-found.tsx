import { StateScreen } from "@/components/storefront/state-screen";

// For notFound() thrown inside a truck's pages (for example, a stop whose menu
// was removed). An unknown truck slug never gets here: the layout throws, so
// app/not-found.tsx handles that one.
export default function StorefrontNotFound() {
  return (
    <StateScreen title="We can’t find that page">
      <p>The link may be out of date. Head back to the truck&apos;s page to see what&apos;s on now.</p>
    </StateScreen>
  );
}
