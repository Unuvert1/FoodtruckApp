"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderView } from "@/lib/types";

/**
 * Notices PAID orders that weren't there on the previous render. The first render
 * only seeds the set, so opening the dashboard with orders waiting doesn't alarm.
 * Also puts "(2)" in the tab title while the tab is hidden, because the vendor
 * often has another tab in front.
 */
export function useNewOrders(orders: OrderView[]) {
  const seen = useRef<Set<string> | null>(null);
  const [arrived, setArrived] = useState<string[]>([]); // ids to animate
  const [arrivalKey, setArrivalKey] = useState(0); // bumps to retrigger the flash and chime

  const paidKey = orders
    .filter((o) => o.status === "PAID")
    .map((o) => o.id)
    .join(",");
  const newCount = paidKey ? paidKey.split(",").length : 0;

  useEffect(() => {
    const paid = paidKey ? paidKey.split(",") : [];
    if (seen.current === null) {
      seen.current = new Set(paid);
      return;
    }
    const known = seen.current;
    const fresh = paid.filter((id) => !known.has(id));
    for (const id of paid) known.add(id);
    if (fresh.length > 0) {
      setArrived(fresh);
      setArrivalKey((k) => k + 1);
    }
  }, [paidKey]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s/, "");
    function sync() {
      document.title = document.visibilityState === "hidden" && newCount > 0 ? `(${newCount}) ${base}` : base;
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      document.title = base;
    };
  }, [newCount]);

  return { arrived, arrivalKey, newCount };
}
