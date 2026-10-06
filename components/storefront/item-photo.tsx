"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  /** Empty for a thumbnail that sits next to the item's name (the name already says it). */
  alt: string;
  className?: string;
};

/**
 * A menu item photo in a fixed-shape box, so the page doesn't jump while it
 * loads. Renders nothing when the item has no photo or the image fails to load,
 * so the row just reads as text.
 */
export function ItemPhoto({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className={cn("overflow-hidden bg-muted", className)}>
      {/* Plain <img>: vendors can host photos anywhere, so next/image would need every domain listed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </div>
  );
}
