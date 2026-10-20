"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Lock, MapPin, Search as SearchIcon } from "lucide-react";
import type { Suggestion } from "@/lib/geo/types";
import { singleLineAddress } from "@/lib/service";
import type { Location } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Where a stop is: a saved spot, a fresh geocoder result, or an address typed by hand. */
export type PlaceValue =
  | { kind: "saved"; location: Location; reused?: boolean }
  | { kind: "found"; provider: "geoapify" | "photon"; suggestion: Suggestion; name: string; notes: string }
  | { kind: "manual"; name: string; addressLine: string; city: string; region: string; postcode: string; notes: string };

/** The slice of saveStop / saveSpot input that describes the place. */
export function placeInput(value: PlaceValue) {
  if (value.kind === "saved") return { locationId: value.location.id };
  if (value.kind === "found") {
    const s = value.suggestion;
    return {
      place: {
        provider: value.provider,
        providerPlaceId: s.providerPlaceId,
        name: value.name,
        addressLine: s.addressLine,
        city: s.city,
        region: s.region,
        postcode: s.postcode,
        lat: s.lat,
        lng: s.lng,
        notes: value.notes,
      },
    };
  }
  const { name, addressLine, city, region, postcode, notes } = value;
  return { place: { provider: "manual" as const, providerPlaceId: null, lat: null, lng: null, name, addressLine, city, region, postcode, notes } };
}

type Result = { q: string; suggestions: Suggestion[]; provider: string; failed: string | null };
type Option = { type: "spot"; location: Location } | { type: "suggestion"; suggestion: Suggestion };

const DEBOUNCE_MS = 300;

type Props = {
  value: PlaceValue | null;
  onChange: (value: PlaceValue | null) => void;
  spots: Location[];
  error?: string | null;
  /** Set when the spot can't change (the stop has orders): shown instead of the Change button. */
  lockedReason?: string;
  /** Accessible name for the search box. Defaults to the schedule's wording. */
  label?: string;
};

export function PlaceCombobox({ value, onChange, spots, error, lockedReason, label }: Props) {
  if (value) return <ConfirmBlock value={value} onChange={onChange} error={error} lockedReason={lockedReason} />;
  return <SearchPhase spots={spots} onChange={onChange} error={error} label={label} />;
}

// ─── Search ────────────────────────────────────────────────────────────────

function SearchPhase({ spots, onChange, error, label = "Where is this stop?" }: Pick<Props, "spots" | "onChange" | "error" | "label">) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const q = query.trim();
  const searching = q.length >= 3;
  const loading = searching && result?.q !== q;

  // Debounced lookup. Only async callbacks set state, so a stale response can't land.
  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const body = (await res.json().catch(() => null)) as { provider?: string; suggestions?: Suggestion[]; degraded?: boolean; error?: string } | null;
        if (!res.ok) setResult({ q, suggestions: [], provider: "", failed: body?.error ?? "Address search isn't working right now." });
        else setResult({ q, suggestions: body?.suggestions ?? [], provider: body?.provider ?? "geoapify", failed: body?.degraded ? "Address search isn't responding." : null });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResult({ q, suggestions: [], provider: "", failed: "Address search isn't working right now." });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, searching]);

  // Saved spots: all of them while empty, the matching ones while typing.
  const needle = q.toLowerCase();
  const matchingSpots = spots.filter((s) => !needle || `${s.name} ${s.addressLine} ${s.city}`.toLowerCase().includes(needle));
  const suggestions = searching && result?.q === q ? result.suggestions : [];
  const options: Option[] = [
    ...matchingSpots.map((location): Option => ({ type: "spot", location })),
    ...suggestions.map((suggestion): Option => ({ type: "suggestion", suggestion })),
  ];
  const activeIndex = Math.min(active, options.length - 1);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function pick(option: Option) {
    if (option.type === "spot") return onChange({ kind: "saved", location: option.location });
    const s = option.suggestion;
    const provider = result?.provider === "photon" ? "photon" : "geoapify";
    const known = s.providerPlaceId ? spots.find((x) => x.provider === provider && x.providerPlaceId === s.providerPlaceId) : undefined;
    if (known) return onChange({ kind: "saved", location: known, reused: true });
    onChange({ kind: "found", provider, suggestion: s, name: s.suggestedName, notes: "" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (!options.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      // Never submit the form from here.
      e.preventDefault();
      if (open && options[activeIndex]) pick(options[activeIndex]);
    } else if (e.key === "Escape" && open) {
      // Close the list, not the sheet around it.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  const showList = open && (options.length > 0 || searching);
  let note: string | null = null;
  if (searching && !loading && !suggestions.length) note = result?.failed ?? "No addresses found.";
  else if (searching && result?.failed) note = result.failed;

  return (
    <div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined}
          aria-label={label}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          placeholder={spots.length ? "Pick a spot or type an address" : "Type an address or a place"}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-12 rounded-xl pr-3.5 pl-10 text-base focus-visible:ring-4"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Places"
          // Keep focus in the input while tapping an option.
          onMouseDown={(e) => e.preventDefault()}
          className="mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface"
        >
          {options.map((option, i) => {
            const isSpot = option.type === "spot";
            const primary = isSpot ? option.location.name : option.suggestion.primary;
            const secondary = isSpot ? singleLineAddress(option.location) : option.suggestion.secondary;
            const heading = i === 0 || options[i - 1].type !== option.type ? (isSpot ? "Your spots" : "Addresses") : null;
            return (
              <li key={isSpot ? option.location.id : `${i}-${option.suggestion.providerPlaceId}`} role="presentation" className="border-b border-border last:border-b-0">
                {heading && (
                  <p role="presentation" className="bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                    {heading}
                  </p>
                )}
                <div
                  id={`${uid}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => pick(option)}
                  onMouseMove={() => i !== activeIndex && setActive(i)}
                  className={cn("flex cursor-pointer items-start gap-3 px-3.5 py-3", i === activeIndex && "bg-muted")}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{primary}</span>
                    {secondary && <span className="block truncate text-sm text-muted-foreground">{secondary}</span>}
                  </span>
                </div>
              </li>
            );
          })}
          {loading && (
            <li role="presentation" className="px-3.5 py-3 text-sm text-muted-foreground">
              Searching…
            </li>
          )}
          {note && (
            <li role="presentation" className="px-3.5 py-3 text-sm text-muted-foreground">
              {note}
            </li>
          )}
        </ul>
      )}

      {error && (
        <p role="alert" data-field-error className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <p className="mt-2.5 text-sm text-muted-foreground">
        Not finding it?{" "}
        <button
          type="button"
          onClick={() => onChange({ kind: "manual", name: "", addressLine: "", city: "", region: "", postcode: "", notes: "" })}
          className="rounded-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          Enter it manually
        </button>
      </p>
    </div>
  );
}

// ─── Confirm block ─────────────────────────────────────────────────────────

function ConfirmBlock({ value, onChange, error, lockedReason }: { value: PlaceValue; onChange: Props["onChange"]; error?: string | null; lockedReason?: string }) {
  const uid = useId();
  const place = value.kind === "saved" ? value.location : value.kind === "found" ? value.suggestion : null;

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {value.kind === "saved" && <p className="truncate font-semibold">{value.location.name}</p>}
          {place && <p className={cn("text-sm", value.kind === "saved" ? "text-muted-foreground" : "font-medium")}>{singleLineAddress(place)}</p>}
          {value.kind === "manual" && <p className="font-medium">Enter the address</p>}
          {value.kind === "saved" && value.location.notes && <p className="mt-0.5 text-sm text-muted-foreground">{value.location.notes}</p>}
          {value.kind === "saved" && value.reused && <p className="mt-1 text-sm font-medium text-ok">You already have a spot here.</p>}
        </div>
        {!lockedReason && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="-my-1 h-9 shrink-0 rounded-full px-3 text-sm font-semibold text-brand outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Change
          </button>
        )}
      </div>

      {lockedReason && (
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {lockedReason}
        </p>
      )}

      {value.kind === "found" && (
        <div className="mt-4 space-y-4">
          <TextField id={`${uid}-name`} label="Name this spot" hint="Customers see this as the headline." value={value.name} onChange={(name) => onChange({ ...value, name })} />
          <TextField
            id={`${uid}-notes`}
            label="Parking note (optional)"
            placeholder="Patio side, by the loading door."
            value={value.notes}
            onChange={(notes) => onChange({ ...value, notes })}
          />
        </div>
      )}

      {value.kind === "manual" && (
        <div className="mt-4 space-y-4">
          <TextField id={`${uid}-name`} label="Name this spot" hint="Customers see this as the headline." value={value.name} onChange={(name) => onChange({ ...value, name })} />
          <TextField id={`${uid}-address`} label="Street address" autoComplete="street-address" value={value.addressLine} onChange={(addressLine) => onChange({ ...value, addressLine })} />
          <div className="grid grid-cols-[1fr_5rem_6rem] gap-3">
            <TextField id={`${uid}-city`} label="City" value={value.city} onChange={(city) => onChange({ ...value, city })} />
            <TextField id={`${uid}-region`} label="State" value={value.region} onChange={(region) => onChange({ ...value, region })} />
            <TextField id={`${uid}-zip`} label="Zip" inputMode="numeric" value={value.postcode} onChange={(postcode) => onChange({ ...value, postcode })} />
          </div>
          <TextField
            id={`${uid}-notes`}
            label="Parking note (optional)"
            placeholder="Patio side, by the loading door."
            value={value.notes}
            onChange={(notes) => onChange({ ...value, notes })}
          />
        </div>
      )}

      {error && (
        <p role="alert" data-field-error className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  ...rest
}: { id: string; label: string; hint?: string; value: string; onChange: (value: string) => void } & Omit<React.ComponentProps<"input">, "onChange" | "value" | "id">) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} className="h-12 rounded-xl px-3.5 text-base" {...rest} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
