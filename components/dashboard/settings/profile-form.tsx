"use client";

import { useState, useTransition } from "react";
import { saveProfile, saveSlug } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { PhotoField } from "@/components/dashboard/photo-field";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  name: string;
  tagline: string;
  logoUrl: string | null;
  slug: string;
  customDomain: string | null;
  appHost: string;
};

export function ProfileForm({ name: initialName, tagline: initialTagline, logoUrl: initialLogo, slug, customDomain, appHost }: Props) {
  const [name, setName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo);
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const dirty = name !== initialName || tagline !== initialTagline || logoUrl !== initialLogo;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => setResult(await saveProfile({ name, tagline, logoUrl })));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} noValidate>
        <Section title="Truck profile" description="Who you are and where customers find you.">
          <FieldRow label="Truck name" htmlFor="truck-name">
            <Input
              id="truck-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setResult(null);
              }}
              maxLength={60}
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="Tagline" htmlFor="truck-tagline" hint="Shown under your name on your ordering page.">
            <Input
              id="truck-tagline"
              value={tagline}
              onChange={(e) => {
                setTagline(e.target.value);
                setResult(null);
              }}
              maxLength={80}
              placeholder="Low and slow"
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="Logo">
            <div className="max-w-xs">
              <PhotoField
                value={logoUrl}
                onChange={(url) => {
                  setLogoUrl(url);
                  setResult(null);
                }}
              />
            </div>
          </FieldRow>
          <SaveRow dirty={dirty} pending={pending} result={result} />
        </Section>
      </form>

      <AddressSection slug={slug} appHost={appHost} customDomain={customDomain} />
    </div>
  );
}

function AddressSection({ slug, appHost, customDomain }: { slug: string; appHost: string; customDomain: string | null }) {
  const [value, setValue] = useState(slug);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const next = value.trim().toLowerCase();
  const changed = next !== slug;

  function confirm() {
    startTransition(async () => {
      const saved = await saveSlug(next);
      setResult(saved);
      if (saved.ok) setConfirming(false);
    });
  }

  return (
    <Section title="Ordering page address" description="The link customers use to order from you.">
      <FieldRow
        label="Address"
        htmlFor="truck-slug"
        hint="Changing this breaks every link and QR code you have already shared."
      >
        <div className="flex items-center gap-2">
          <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">{appHost}/</span>
          <Input
            id="truck-slug"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setConfirming(false);
              setResult(null);
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={40}
            className={inputClass}
          />
        </div>

        {confirming ? (
          <div role="alertdialog" aria-label="Confirm address change" className="mt-3 border-t border-border pt-3">
            <p className="text-sm">
              Change your address from <strong className="font-semibold">/{slug}</strong> to <strong className="font-semibold">/{next}</strong>? The old link
              will stop working right away.
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={confirm} disabled={pending} className="h-11 rounded-xl px-5 text-base font-semibold">
                {pending ? "Changing…" : "Change address"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={pending} className="h-11 rounded-xl px-4 text-base">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={!changed}
            onClick={() => {
              setResult(null);
              setConfirming(true);
            }}
            className="mt-3 h-11 rounded-xl px-5 text-base font-semibold"
          >
            Change address
          </Button>
        )}

        {result && (
          <p role="status" className={result.ok ? "mt-2 text-sm text-ok" : "mt-2 text-sm font-medium text-destructive"}>
            {result.ok ? "Address changed." : result.error}
          </p>
        )}
      </FieldRow>

      <FieldRow label="Custom domain" hint="Custom domains aren't switched on yet.">
        <p className="pt-3 text-base">{customDomain ?? <span className="text-muted-foreground">Not set</span>}</p>
      </FieldRow>
    </Section>
  );
}
