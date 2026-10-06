"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, WifiOff } from "lucide-react";

type Props = {
  /** When the server built this page (ISO). It changes every time a refresh succeeds. */
  renderedAt: string;
  /** How often the page polls, so we know when a refresh is overdue. */
  seconds: number;
};

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
}

/**
 * Tells the customer how fresh the status is, and says so plainly when it
 * isn't. The page polls (see AutoRefresh); a successful poll gives us a new
 * `renderedAt`, so a stale one means polling is failing, usually bad wifi.
 */
export function RefreshStatus({ renderedAt, seconds }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [now, setNow] = useState<number | null>(null); // null until mounted, so server and client markup match
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 5000);
    const sync = () => setOnline(navigator.onLine);
    const first2 = setTimeout(sync, 0);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      clearTimeout(first);
      clearTimeout(first2);
      clearInterval(id);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const elapsed = now === null ? 0 : now - Date.parse(renderedAt);
  const overdue = now !== null && elapsed > seconds * 2.5 * 1000;
  const problem = !online || overdue;

  return (
    <div className="mt-3">
      {problem && (
        <div
          role="status"
          className="mb-3 flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            {!online
              ? "You're offline. This status may be out of date."
              : "We couldn't refresh your status. It may be out of date."}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>{now === null ? " " : `Updated ${ago(elapsed)}`}</p>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-3 font-semibold text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
        >
          <RefreshCw aria-hidden className={refreshing ? "size-4 motion-safe:animate-spin" : "size-4"} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
