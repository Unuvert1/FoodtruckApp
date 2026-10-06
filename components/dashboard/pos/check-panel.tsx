"use client";

import { useState } from "react";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CheckLine } from "@/components/dashboard/pos/check-line";
import type { DisplayLine } from "@/components/dashboard/pos/use-check";

type Props = {
  lines: DisplayLine[];
  count: number;
  totals: { subtotalCents: number; taxCents: number; totalCents: number };
  taxPercent: string; // "8.25"
  totalsMode: "full" | "total" | "none";
  selectedKey: string | null;
  flash: { key: string; n: number } | null;
  onSelect: (key: string | null) => void;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onOptions: (line: DisplayLine) => void;
  onClear: () => void;
  onClose?: () => void; // only inside the phone sheet
  footer: React.ReactNode;
};

const focus = "outline-none focus-visible:ring-4 focus-visible:ring-foreground/30";

export function CheckPanel(props: Props) {
  const { lines, count, totals, taxPercent, totalsMode, selectedKey, flash, footer } = props;
  const [confirmClear, setConfirmClear] = useState(false);
  const empty = lines.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <h2 className="text-[1.0625rem] font-semibold">Check</h2>
        <span className="text-[0.9375rem] text-muted-foreground tabular-nums">{count}</span>
        <div className="ml-auto flex items-center gap-1">
          {!empty && (
            <button
              type="button"
              onClick={() => {
                if (confirmClear) {
                  props.onClear();
                  setConfirmClear(false);
                } else setConfirmClear(true);
              }}
              onBlur={() => setConfirmClear(false)}
              className={cn(
                "h-11 rounded-full px-4 text-[0.9375rem] font-semibold",
                focus,
                confirmClear ? "bg-destructive/10 text-destructive" : "text-muted-foreground"
              )}
            >
              {confirmClear ? "Clear check?" : "Clear"}
            </button>
          )}
          {props.onClose && (
            <button type="button" onClick={props.onClose} className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-semibold", focus)}>
              Close
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="px-4 py-10 text-center text-[0.9375rem] text-muted-foreground">
            <p>No items yet.</p>
            <p>Tap a dish to start the check.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <CheckLine
                key={line.key}
                line={line}
                selected={selectedKey === line.key}
                flashN={flash?.key === line.key ? flash.n : null}
                onSelect={() => props.onSelect(selectedKey === line.key ? null : line.key)}
                onQuantity={(q) => props.onQuantity(line.key, q)}
                onRemove={() => props.onRemove(line.key)}
                onOptions={() => props.onOptions(line)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="max-h-[75%] shrink-0 overflow-y-auto border-t border-dashed border-border">
        {!empty && totalsMode !== "none" && (
          <dl className="space-y-1 px-4 pt-3 text-[0.8125rem] tabular-nums">
            {totalsMode === "full" && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatCents(totals.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax {taxPercent}%</dt>
                  <dd>{formatCents(totals.taxCents)}</dd>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-[0.9375rem] font-semibold">Total</dt>
              <dd className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em]">{formatCents(totals.totalCents)}</dd>
            </div>
          </dl>
        )}
        <div className="px-4 pt-3 pb-4">{footer}</div>
      </div>
    </div>
  );
}
