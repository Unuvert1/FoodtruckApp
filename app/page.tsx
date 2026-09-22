import { redirect } from "next/navigation";

// No platform landing page yet. Send visitors to the seeded demo storefront.
export default function Home() {
  redirect("/demo-truck");
}
