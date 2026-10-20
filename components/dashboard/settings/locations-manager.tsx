"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { countSpotStops, saveLocation, setLocationArchived, type SaveLocationResult } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { PlaceCombobox, placeInput, type PlaceValue } from "@/components/dashboard/place-combobox";
import { SaveRow } from "@/components/dashboard/settings/save-row";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Location } from "@/lib/types";

type Editing = { location: Location | null } | null;

export function LocationsManager({ locations }: { locations: Location[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  // The spot being archived, once we know it has stops still to come.
  const [confirming, setConfirming] = useState<{ id: string; count: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const active = locations.filter((l) => !l.archivedAt);
  const archived = locations.filter((l) => l.archivedAt);

  function setArchived(location: Location, archive: boolean) {
    setError(null);
    setConfirming(null);
    startTransition(async () => {
      const result = await setLocationArchived({ locationId: location.id, archived: archive });
      if (!result.ok) setError(result.error);
    });
  }

  function toggleArchived(location: Location) {
    if (confirming?.id === location.id) return setConfirming(null);
    if (location.archivedAt) return setArchived(location, false);
    setError(null);
    startTransition(async () => {
      const result = await countSpotStops(location.id);
      if (!result.ok) return setError(result.error);
      // Nothing upcoming: no need to ask.
      if (result.count === 0) return setArchived(location, true);
      setConfirming({ id: location.id, count: result.count });
    });
  }

  const rowProps = (location: Location) => ({
    location,
    pending,
    confirmCount: confirming?.id === location.id ? confirming.count : null,
    onEdit: () => setEditing({ location }),
    onToggle: () => toggleArchived(location),
    onConfirm: () => setArchived(location, true),
    onCancel: () => setConfirming(null),
  });

  return (
    <section className="max-w-2xl rounded-2xl bg-surface">
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-[1.25rem] leading-tight font-semibold tracking-[-0.02em]">Locations</h2>
          <p className="mt-1 text-sm text-muted-foreground">The spots you serve from. Pick one when you schedule a service.</p>
        </div>
        <Button type="button" onClick={() => setEditing({ location: null })} className="h-11 shrink-0 gap-1.5 rounded-xl px-4 text-sm font-semibold">
          <Plus aria-hidden className="size-4" />
          Add
        </Button>
      </header>

      <div className="divide-y divide-border border-t border-border">
        {active.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No locations yet. Add the first spot you serve from.</p>}
        {active.map((location) => (
          <LocationRow key={location.id} {...rowProps(location)} />
        ))}
        {error && (
          <p role="alert" className="px-5 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      {archived.length > 0 && (
        <div className="border-t border-border">
          <p className="px-5 pt-4 pb-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Archived</p>
          <div className="divide-y divide-border pb-2">
            {archived.map((location) => (
              <LocationRow key={location.id} {...rowProps(location)} />
            ))}
          </div>
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 shadow-none sm:max-w-md">
          {editing && <LocationForm key={editing.location?.id ?? "new"} location={editing.location} spots={active} onSaved={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function LocationRow({
  location,
  pending,
  confirmCount,
  onEdit,
  onToggle,
  onConfirm,
  onCancel,
}: {
  location: Location;
  pending: boolean;
  confirmCount: number | null;
  onEdit: () => void;
  onToggle: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isArchived = location.archivedAt !== null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <div className={isArchived ? "min-w-0 flex-1 basis-48 opacity-60" : "min-w-0 flex-1 basis-48"}>
        <p className="truncate text-base font-medium">{location.name}</p>
        <p className="truncate text-sm text-muted-foreground">{[location.addressLine, location.city].filter(Boolean).join(", ")}</p>
        {location.notes && <p className="truncate text-sm text-muted-foreground">{location.notes}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onEdit} className="h-11 rounded-xl px-4 text-sm font-semibold">
          Edit
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onToggle} className="h-11 rounded-xl px-4 text-sm font-semibold">
          {isArchived ? "Restore" : "Archive"}
        </Button>
      </div>
      {confirmCount !== null && (
        <div role="alertdialog" aria-label="Confirm archive" className="basis-full border-t border-border pt-3">
          <p className="text-sm">
            {confirmCount === 1 ? "1 upcoming stop is" : `${confirmCount} upcoming stops are`} at this spot. They stay on your schedule, but you won&apos;t be able to pick this spot for new ones.
          </p>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm} className="h-11 rounded-xl px-5 text-sm font-semibold">
              {pending ? "Archiving…" : "Archive anyway"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} className="h-11 rounded-xl px-4 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** What the combobox starts from when editing: the spot as stored, keeping its provider and pin. */
function initialPlace(location: Location | null): PlaceValue | null {
  if (!location) return null;
  const { provider } = location;
  if (provider === "geoapify" || provider === "photon") {
    const address = [location.addressLine, location.city].filter(Boolean).join(", ");
    return {
      kind: "found",
      provider,
      name: location.name,
      notes: location.notes ?? "",
      suggestion: {
        providerPlaceId: location.providerPlaceId,
        primary: location.addressLine,
        secondary: address,
        suggestedName: location.name,
        addressLine: location.addressLine,
        city: location.city,
        region: location.region,
        postcode: location.postcode,
        lat: location.lat,
        lng: location.lng,
      },
    };
  }
  return { kind: "manual", name: location.name, addressLine: location.addressLine, city: location.city, region: location.region, postcode: location.postcode, notes: location.notes ?? "" };
}

function LocationForm({ location, spots, onSaved }: { location: Location | null; spots: Location[]; onSaved: () => void }) {
  const [place, setPlace] = useState<PlaceValue | null>(() => initialPlace(location));
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SaveLocationResult | null>(null);
  const [pending, startTransition] = useTransition();

  // While editing, the search shouldn't offer other spots: picking one would mean replacing this one.
  const offered = location ? [] : spots;

  function change(next: PlaceValue | null) {
    setPlace(next);
    setDirty(true);
    setResult(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!place) return setResult({ ok: false, error: "Choose where this spot is." });
    // They picked a spot they already have: nothing to save.
    if (place.kind === "saved") return onSaved();

    const input = placeInput(place).place!;
    // A typed address keeps the stored pin and provider only while the address itself is unchanged.
    const same =
      location &&
      place.kind === "manual" &&
      location.addressLine === input.addressLine.trim() &&
      location.city === input.city.trim() &&
      location.region === input.region.trim() &&
      location.postcode === input.postcode.trim();
    const kept = same ? { provider: location.provider as "geoapify" | "photon" | "manual", providerPlaceId: location.providerPlaceId, lat: location.lat, lng: location.lng } : {};

    startTransition(async () => {
      const saved = await saveLocation({ locationId: location?.id, ...input, ...kept });
      setResult(saved);
      if (saved.ok) {
        setDirty(false);
        // Saved with a note: keep the sheet open so it can be read.
        if (!saved.note) onSaved();
      }
    });
  }

  const done = result?.ok === true && Boolean(result.note);
  const reused = place?.kind === "saved" && place.reused === true;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-full flex-col">
      <div className="px-5 pt-6">
        <SheetTitle className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">{location ? "Edit location" : "Add location"}</SheetTitle>
        <SheetDescription className="mt-2">Customers see this spot on your ordering page.</SheetDescription>
      </div>

      <div className="mt-5 px-5">
        <PlaceCombobox value={place} onChange={change} spots={offered} label="Where is this spot?" />
        {place?.kind === "found" && place.suggestion.lat == null && (
          <p className="mt-3 text-sm text-muted-foreground">This address has no map pin. Directions will use the street address.</p>
        )}
      </div>

      <div className="mt-auto pt-6">
        {done && (
          <div className="px-5">
            <Button type="button" variant="secondary" onClick={onSaved} className="h-12 w-full rounded-xl text-base font-semibold">
              Done
            </Button>
          </div>
        )}
        <SaveRow dirty={dirty && place !== null && !reused} pending={pending} result={result} label="Save location" />
      </div>
    </form>
  );
}
