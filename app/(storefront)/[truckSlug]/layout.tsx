import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTruckFromRequest } from "@/lib/tenant";

type Props = {
  children: React.ReactNode;
  params: Promise<{ truckSlug: string }>;
};

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { truckSlug } = await params;
  const truck = await getTruckFromRequest(truckSlug);
  if (!truck) return {};
  return { title: `Order ahead from ${truck.name}`, description: truck.tagline };
}

// Branding → CSS custom properties. Everything inside picks up the truck's
// color through --brand (and --primary, which globals.css points at it).
export default async function TruckLayout({ children, params }: Props) {
  const { truckSlug } = await params;
  const truck = await getTruckFromRequest(truckSlug);
  if (!truck) notFound();

  return (
    <div
      style={
        {
          "--brand": truck.branding.color,
          "--brand-foreground": truck.branding.colorForeground,
        } as React.CSSProperties
      }
      className="min-h-dvh bg-background"
    >
      {children}
    </div>
  );
}
