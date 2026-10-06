"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { saveStorefront } from "@/app/(dashboard)/dashboard/(app)/settings/actions";
import { PhotoField } from "@/components/dashboard/photo-field";
import { FieldRow, inputClass } from "@/components/dashboard/settings/field-row";
import { SaveRow, type SaveState } from "@/components/dashboard/settings/save-row";
import { Section } from "@/components/dashboard/settings/section";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const WHITE = "#FFFFFF";
const INK = "#1D2733";
const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two #RRGGBB colours, e.g. 4.6. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type Props = {
  brandColor: string;
  brandColorForeground: string;
  heroImageUrl: string | null;
  name: string;
  tagline: string;
  logoUrl: string | null;
  slug: string;
};

export function StorefrontForm(props: Props) {
  const [color, setColor] = useState(props.brandColor.toUpperCase());
  const [foreground, setForeground] = useState(props.brandColorForeground.toUpperCase());
  const [heroUrl, setHeroUrl] = useState<string | null>(props.heroImageUrl);
  const [result, setResult] = useState<SaveState>(null);
  const [pending, startTransition] = useTransition();

  const validColor = HEX.test(color);
  const dirty =
    color.toUpperCase() !== props.brandColor.toUpperCase() ||
    foreground !== props.brandColorForeground.toUpperCase() ||
    heroUrl !== props.heroImageUrl;
  const previewColor = validColor ? color : props.brandColor;

  function change<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setResult(null);
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () =>
      setResult(
        await saveStorefront({
          brandColor: color,
          brandColorForeground: foreground === INK ? INK : WHITE,
          heroImageUrl: heroUrl,
        })
      )
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <Section title="Storefront" description="What customers see when they open your ordering page.">
        <FieldRow label="Brand colour" htmlFor="brand-hex">
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Pick a brand colour"
              value={validColor ? color.toLowerCase() : props.brandColor.toLowerCase()}
              onChange={(e) => change(setColor)(e.target.value.toUpperCase())}
              className="size-12 shrink-0 cursor-pointer rounded-xl border border-input bg-transparent p-1"
            />
            <Input
              id="brand-hex"
              value={color}
              onChange={(e) => change(setColor)(e.target.value.trim())}
              maxLength={7}
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!validColor}
              className={cn(inputClass, "max-w-40 font-mono")}
            />
          </div>
          {!validColor && <p className="mt-1.5 text-sm font-medium text-destructive">Use a hex colour like #22603F.</p>}
        </FieldRow>

        <FieldRow label="Text on brand colour" hint="Pick whichever is easier to read on your colour.">
          <div role="radiogroup" aria-label="Text colour on your brand colour" className="grid grid-cols-2 gap-3">
            {[
              { value: WHITE, label: "White" },
              { value: INK, label: "Dark" },
            ].map((option) => {
              const selected = foreground === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => change(setForeground)(option.value)}
                  className={cn(
                    "flex h-20 flex-col items-start justify-between rounded-xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected ? "ring-2 ring-foreground" : "ring-1 ring-border"
                  )}
                  style={{ backgroundColor: previewColor, color: option.value }}
                >
                  <span className="text-base font-semibold">{option.label}</span>
                  <span className="text-xs opacity-90">
                    Contrast {contrast(previewColor, option.value).toFixed(1)}:1
                  </span>
                </button>
              );
            })}
          </div>
        </FieldRow>

        <FieldRow label="Header image" hint="A wide photo of your truck or food, shown at the top of your page.">
          <div className="max-w-xs">
            <PhotoField value={heroUrl} onChange={change(setHeroUrl)} />
          </div>
        </FieldRow>

        <FieldRow label="Preview">
          <div className="overflow-hidden rounded-xl" style={{ backgroundColor: previewColor, color: foreground }}>
            {heroUrl && (
              <div className="relative aspect-3/1 w-full">
                <Image src={heroUrl} alt="" fill sizes="(max-width: 768px) 100vw, 560px" className="object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3 p-4">
              {props.logoUrl && (
                <Image src={props.logoUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.02em]">{props.name}</p>
                {props.tagline && <p className="truncate text-sm opacity-85">{props.tagline}</p>}
              </div>
            </div>
          </div>
          <a
            href={`/${props.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          >
            Open your ordering page
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </FieldRow>

        <SaveRow dirty={dirty && validColor} pending={pending} result={result} />
      </Section>
    </form>
  );
}
