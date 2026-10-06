"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { saveLocation, setLocationArchived } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { inputClass } from "@/components/dashboard/settings/field-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Location } from "@/lib/types";

type Editing = { location: Location | null } | null;

export function LocationsManager({ locations }: { locations: Location[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = locations.filter((l) => !l.archivedAt);
  const archived = locations.filter((l) => l.archivedAt);

  function toggleArchived(location: Location) {
    setError(null);
    startTransition(async () => {
      const result = await setLocationArchived({ locationId: location.id, archived: !location.archivedAt });
      if (!result.ok) setError(result.error);
    });
  }

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
          <LocationRow key={location.id} location={location} pending={pending} onEdit={() => setEditing({ location })} onToggle={() => toggleArchived(location)} />
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
              <LocationRow key={location.id} location={location} pending={pending} onEdit={() => setEditing({ location })} onToggle={() => toggleArchived(location)} />
            ))}
          </div>
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-surface p-0 shadow-none sm:max-w-md">
          {editing && <LocationForm key={editing.location?.id ?? "new"} location={editing.location} onSaved={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function LocationRow({ location, pending, onEdit, onToggle }: { location: Location; pending: boolean; onEdit: () => void; onToggle: () => void }) {
  const isArchived = location.archivedAt !== null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <div className={isArchived ? "min-w-0 flex-1 basis-48 opacity-60" : "min-w-0 flex-1 basis-48"}>
        <p className="truncate text-base font-medium">{location.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {location.addressLine}, {location.city}
        </p>
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
    </div>
  );
}

function LocationForm({ location, onSaved }: { location: Location | null; onSaved: () => void }) {
  const [name, setName] = useState(location?.name ?? "");
  const [addressLine, setAddressLine] = useState(location?.addressLine ?? "");
  const [city, setCity] = useState(location?.city ?? "");
  const [mapsLink, setMapsLink] = useState("");
  const [notes, setNotes] = useState(location?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasCoords = location?.lat != null && location?.lng != null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveLocation({ locationId: location?.id, name, addressLine, city, mapsLink, notes });
      if (!result.ok) return setError(result.error);
      // Saved either way. If the link couldn't be read, say so before closing is too late, so keep the sheet open.
      if (result.note) return setNote(result.note);
      onSaved();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-full flex-col">
      <div className="px-5 pt-6">
        <SheetTitle className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">{location ? "Edit location" : "Add location"}</SheetTitle>
        <SheetDescription className="mt-2">Customers see this spot on your ordering page.</SheetDescription>
      </div>

      <div className="mt-5 space-y-5 px-5">
        <div>
          <Label htmlFor="loc-name" className="mb-2 font-semibold">Name</Label>
          <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Riverside Park" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="loc-address" className="mb-2 font-semibold">Street address</Label>
          <Input id="loc-address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} maxLength={120} autoComplete="street-address" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="loc-city" className="mb-2 font-semibold">City</Label>
          <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} autoComplete="address-level2" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="loc-link" className="mb-2 font-semibold">Google Maps link</Label>
          <Input
            id="loc-link"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            maxLength={500}
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Paste a link to the spot"
            className={inputClass}
          />
          <p className="mt-1.5 text-sm text-muted-foreground">
            Optional. In Google Maps, press and hold the spot, then share and copy the link. It lets customers get directions.
            {hasCoords && !mapsLink && " This spot already has a map pin; paste a new link to move it."}
            {!hasCoords && location && !mapsLink && " This spot has no map pin yet."}
          </p>
        </div>
        <div>
          <Label htmlFor="loc-notes" className="mb-2 font-semibold">Notes</Label>
          <Input id="loc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder="Find us by the fountain" className={inputClass} />
        </div>
      </div>

      <div className="mt-auto space-y-3 px-5 pt-6 pb-6">
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {note && (
          <p role="status" className="text-sm text-ok">
            {note}
          </p>
        )}
        {note ? (
          <Button type="button" onClick={onSaved} className="h-12 w-full rounded-xl text-base font-semibold">
            Done
          </Button>
        ) : (
          <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-base font-semibold">
            {pending ? "Saving…" : "Save location"}
          </Button>
        )}
      </div>
    </form>
  );
}
