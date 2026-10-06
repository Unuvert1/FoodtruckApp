"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ft.chime";

function playChime(ctx: AudioContext) {
  [880, 1320].forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = hz;
    const t = ctx.currentTime + i * 0.14;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

/**
 * Opt-in sound for new orders. Off by default; the tap that turns it on is the
 * user gesture the browser needs before it will play audio.
 */
export function NewOrderChime({ arrivalKey }: { arrivalKey: number }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  // localStorage is only readable after mount.
  useEffect(() => {
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "on");
    } catch {}
  }, []);

  useEffect(() => {
    // After a reload with the pref on, no tap has happened yet, so there is no
    // AudioContext until the vendor taps the toggle or the page once.
    if (arrivalKey === 0 || !on) return;
    ctxRef.current ??= new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    playChime(ctx);
  }, [arrivalKey, on]);

  function toggle() {
    const next = !on;
    if (next) {
      ctxRef.current ??= new AudioContext();
      void ctxRef.current.resume();
      playChime(ctxRef.current); // a preview, so the vendor knows what it sounds like
    }
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {}
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Chime for new orders"
      onClick={toggle}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl text-lg outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
        on ? "bg-foreground text-background" : "text-muted-foreground"
      )}
    >
      <span aria-hidden>♪</span>
    </button>
  );
}
