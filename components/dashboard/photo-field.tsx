"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Phone photos are 3–8 MB; a menu thumbnail needs a fraction of that. Resizing
// in the browser keeps uploads quick on truck wifi and keeps the stored rows
// small. 1200px still looks sharp on a retina phone at full width.
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.82;

async function downscale(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("That photo couldn't be processed.");
  return { blob, width, height };
}

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function PhotoField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { blob, width, height } = await downscale(file);
      const form = new FormData();
      form.append("photo", new File([blob], "dish.jpg", { type: "image/jpeg" }));
      form.append("width", String(width));
      form.append("height", String(height));

      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) {
        setError(payload?.error ?? "The photo didn't upload. Try again.");
        return;
      }
      onChange(payload.url as string);
    } catch {
      setError("That photo couldn't be read. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so picking the same file twice still fires a change.
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "group relative flex aspect-3/2 w-full items-center justify-center overflow-hidden rounded-2xl outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          value ? "bg-muted" : "bg-muted/60 hover:bg-muted"
        )}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="size-7" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">Add a photo</span>
            <span className="text-xs">Customers see this on your menu</span>
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </span>
        )}
      </button>

      {value && !busy && (
        <div className="mt-2 flex gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Replace photo
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            className="text-sm font-medium text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
          >
            Remove photo
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
