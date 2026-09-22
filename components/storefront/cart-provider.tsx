"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { lineKey, type CartLine } from "@/lib/cart";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean; // false until the saved cart has been read from storage
  add: (menuItemId: string, optionIds: string[], quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** One cart per truck + service, saved in this browser so a refresh doesn't lose it. */
export function CartProvider({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setLines(saved ? JSON.parse(saved) : []);
    } catch {
      setLines([]);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // Storage unavailable (private mode). The cart still works for this visit.
    }
  }, [lines, ready, storageKey]);

  const add = useCallback((menuItemId: string, optionIds: string[], quantity: number) => {
    const key = lineKey(menuItemId, optionIds);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { key, menuItemId, optionIds, quantity }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), ready, add, setQuantity, clear }),
    [lines, ready, add, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
