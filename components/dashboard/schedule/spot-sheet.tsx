"use client";

import { useState, useTransition } from "react";
import { saveSpot } from "@/app/(dashboard)/dashboard/(app)/schedule/actions";
import type { Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { PlaceCombobox, TextField, placeInput, type PlaceValue } from "@/components/dashboard/place-combobox";

export type SpotEditing = { key: string; location: Location | null };

export function SpotSheet({ editing, onClose }: { editing: SpotEditing | null; onClose: () => void }) {
  return (
    <Sheet open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 sm:max-w-md">
        {editing && <SpotForm key={editing.key} location={editing.location} onSaved={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function SpotForm({ location, onSaved }: { location: Location | null; onSaved: () => void }) {
  // A new spot is found the same way as in a stop; an existing one is edited as plain fields.
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [fields, setFields] = useState({
    name: location?.name ?? "",
    addressLine: location?.addressLine ?? "",
    city: location?.city ?? "",
    region: location?.region ?? "",
    postcode: location?.postcode ?? "",
    notes: location?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  function submit() {
    setError(null);
    let input: Parameters<typeof saveSpot>[0];
    if (location) {
      // New words for the same pin are fine; a changed address no longer matches the stored coordinates.
      const moved = (["addressLine", "city", "region", "postcode"] as const).some((k) => fields[k].trim() !== location[k]);
      input = {
        locationId: location.id,
        ...fields,
        ...(moved
          ? { provider: "manual" as const, providerPlaceId: null, lat: null, lng: null }
          : { provider: location.provider === "photon" || location.provider === "geoapify" ? location.provider : ("manual" as const), providerPlaceId: location.providerPlaceId, lat: location.lat, lng: location.lng }),
      };
    } else {
      const chosen = place ? placeInput(place) : null;
      if (!chosen || !("place" in chosen) || !chosen.place) return setError("Choose an address first.");
      input = chosen.place;
    }
    startTransition(async () => {
      const result = await saveSpot(input);
      if (result.ok) onSaved();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="flex min-h-full flex-col">
      <div className="px-5 pt-6">
        <SheetTitle className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">{location ? "Edit spot" : "Add a spot"}</SheetTitle>
        <SheetDescription className="mt-2">
          {location ? "Stops at this spot show the new details." : "Save a place you park, then pick it in one tap when you add a stop."}
        </SheetDescription>
      </div>

      <div className="mt-6 flex-1 border-t border-border px-5 py-6">
        {location ? (
          <div className="space-y-4">
            <TextField id="spot-name" label="Name" hint="Customers see this as the headline." value={fields.name} onChange={set("name")} />
            <TextField id="spot-address" label="Street address" autoComplete="street-address" value={fields.addressLine} onChange={set("addressLine")} />
            <div className="grid grid-cols-[1fr_5rem_6rem] gap-3">
              <TextField id="spot-city" label="City" value={fields.city} onChange={set("city")} />
              <TextField id="spot-region" label="State" value={fields.region} onChange={set("region")} />
              <TextField id="spot-zip" label="Zip" inputMode="numeric" value={fields.postcode} onChange={set("postcode")} />
            </div>
            <TextField id="spot-notes" label="Parking note (optional)" placeholder="Patio side, by the loading door." value={fields.notes} onChange={set("notes")} />
          </div>
        ) : (
          <PlaceCombobox value={place} onChange={setPlace} spots={[]} />
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ErrorBanner message={error} className="mb-3" />
        <Button type="button" disabled={pending} onClick={submit} className="h-12 w-full rounded-xl text-base font-semibold">
          {pending ? "Saving…" : location ? "Save changes" : "Save spot"}
        </Button>
      </div>
    </form>
  );
}
