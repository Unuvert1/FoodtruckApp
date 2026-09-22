"use client";

import { useEffect, useState, useTransition } from "react";
import { createTruck, joinDemo, type CreateTruckResult } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export function OnboardingForm({ appHost, demoAllowed }: { appHost: string; demoAllowed: boolean }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [timezone, setTimezone] = useState("America/Chicago");
  const [zones, setZones] = useState(TIMEZONES);
  const [result, setResult] = useState<CreateTruckResult | null>(null);
  const [pending, startTransition] = useTransition();

  // Default to the vendor's own timezone.
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!local) return;
    setTimezone(local);
    if (!TIMEZONES.some((z) => z.value === local)) setZones([{ value: local, label: local }, ...TIMEZONES]);
  }, []);

  const shownSlug = slugEdited ? slug : slugify(name);
  const errorFor = (field: "name" | "slug" | "timezone") =>
    result && !result.ok && result.field === field ? result.error : null;
  const generalError = result && !result.ok && !result.field ? result.error : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await createTruck({ name, slug: shownSlug, timezone })));
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5 rounded-2xl bg-surface p-5">
        <div>
          <Label htmlFor="truck-name" className="mb-2 font-semibold">
            Truck name
          </Label>
          <Input
            id="truck-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Comal Taqueria"
            aria-invalid={Boolean(errorFor("name"))}
            className="h-12 rounded-xl px-3.5 text-base"
          />
          {errorFor("name") && <p className="mt-1.5 text-sm font-medium text-destructive">{errorFor("name")}</p>}
        </div>

        <div>
          <Label htmlFor="truck-slug" className="mb-2 font-semibold">
            Ordering page address
          </Label>
          <div className="flex h-12 items-center rounded-xl border border-input px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="text-muted-foreground">{appHost}/</span>
            <input
              id="truck-slug"
              value={shownSlug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              aria-invalid={Boolean(errorFor("slug"))}
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          </div>
          {errorFor("slug") ? (
            <p className="mt-1.5 text-sm font-medium text-destructive">{errorFor("slug")}</p>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">Customers order from this link.</p>
          )}
        </div>

        <div>
          <Label htmlFor="truck-tz" className="mb-2 font-semibold">
            Timezone
          </Label>
          <select
            id="truck-tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-surface px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-sm text-muted-foreground">Pickup times show in this timezone.</p>
        </div>

        {generalError && <p className="text-sm font-medium text-destructive">{generalError}</p>}

        <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-base font-semibold">
          {pending ? "Creating your truck…" : "Create my truck"}
        </Button>
      </form>

      {demoAllowed && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-5">
          <p className="font-semibold">Just trying things out?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the seeded demo truck, Comal Taqueria, with its menu and sample orders.
          </p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(async () => setResult(await joinDemo()))}
            className="mt-4 h-11 rounded-xl px-4 text-base"
          >
            Manage the demo truck
          </Button>
        </div>
      )}
    </>
  );
}
