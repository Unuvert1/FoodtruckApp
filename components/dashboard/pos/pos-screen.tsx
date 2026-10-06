"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { ManagedSection, MenuItem } from "@/lib/types";
import { bpsToPercentInput, formatCents } from "@/lib/money";
import { defaultSelections, selectionsFromIds, unmetGroup } from "@/lib/menu/selections";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CategoryRail } from "@/components/dashboard/pos/category-rail";
import { DishGrid } from "@/components/dashboard/pos/dish-grid";
import { CheckPanel } from "@/components/dashboard/pos/check-panel";
import { PosOptions } from "@/components/dashboard/pos/pos-options";
import { TenderStep, type Tender } from "@/components/dashboard/pos/tender-step";
import { CashPad } from "@/components/dashboard/pos/cash-pad";
import { SaleClosed } from "@/components/dashboard/pos/sale-closed";
import { useCheck, type DisplayLine } from "@/components/dashboard/pos/use-check";

type Props = { sections: ManagedSection[]; taxRateBps: number };

type Flow =
  | { step: "check" }
  | { step: "tender" }
  | { step: "cash" }
  | { step: "closed"; tender: Tender; totalCents: number; changeCents: number };

type OptionsTarget = { item: MenuItem; lineKey: string | null; initial: ReturnType<typeof defaultSelections> };

const MD = "(min-width: 768px)";

function useIsWide(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(MD);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(MD).matches,
    () => false
  );
}

export function PosScreen({ sections, taxRateBps }: Props) {
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const check = useCheck(allItems, taxRateBps);
  const wide = useIsWide();

  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [flow, setFlow] = useState<Flow>({ step: "check" });
  const [options, setOptions] = useState<OptionsTarget | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const section = sections.find((s) => s.id === sectionId) ?? sections[0];
  const { totalCents } = check.totals;

  function onDish(item: MenuItem) {
    if (!item.isAvailable) return;
    if (flow.step !== "check") setFlow({ step: "check" });
    const defaults = defaultSelections(item);
    // Routing by decision cost: any required group (or an unmet minimum) asks first;
    // optional-only groups add straight through.
    const needsPanel = item.modifierGroups.some((g) => g.required) || Boolean(unmetGroup(item, defaults));
    if (needsPanel) setOptions({ item, lineKey: null, initial: defaults });
    else check.add(item.id, []);
  }

  function onEditOptions(line: DisplayLine) {
    const item = allItems.find((i) => i.id === line.menuItemId);
    if (!item) return;
    setOptions({ item, lineKey: line.key, initial: selectionsFromIds(item, line.optionIds) });
  }

  function onOptionsSubmit(optionIds: string[]) {
    if (!options) return;
    if (options.lineKey) check.replaceLine(options.lineKey, options.item.id, optionIds);
    else check.add(options.item.id, optionIds);
    setOptions(null);
  }

  // The whole wiring surface for the real pipeline later: nothing persists today.
  function onPaid(tender: Tender, tenderedCents: number) {
    setFlow({ step: "closed", tender, totalCents, changeCents: Math.max(0, tenderedCents - totalCents) });
    check.clear();
  }

  function onNewSale() {
    setFlow({ step: "check" });
    setSheetOpen(false);
  }

  const footer =
    flow.step === "tender" ? (
      <TenderStep
        onBack={() => setFlow({ step: "check" })}
        onCard={() => onPaid("CARD", totalCents)}
        onCash={() => setFlow({ step: "cash" })}
        onOther={() => onPaid("OTHER", totalCents)}
      />
    ) : flow.step === "cash" ? (
      <CashPad totalCents={totalCents} onBack={() => setFlow({ step: "tender" })} onComplete={(t) => onPaid("CASH", t)} />
    ) : check.lines.length > 0 ? (
      <button
        type="button"
        onClick={() => setFlow({ step: "tender" })}
        className="flex h-16 w-full items-center justify-between rounded-xl bg-foreground px-5 text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
      >
        <span>Pay</span>
        <span className="tabular-nums">{formatCents(totalCents)}</span>
      </button>
    ) : (
      <p className="flex h-16 items-center justify-center text-[0.9375rem] text-muted-foreground">Nothing to charge yet.</p>
    );

  const panel =
    flow.step === "closed" ? (
      <SaleClosed tender={flow.tender} totalCents={flow.totalCents} changeCents={flow.changeCents} onNewSale={onNewSale} />
    ) : (
      <CheckPanel
        lines={check.lines}
        count={check.count}
        totals={check.totals}
        taxPercent={bpsToPercentInput(taxRateBps)}
        totalsMode={flow.step === "check" ? "full" : flow.step === "tender" ? "total" : "none"}
        selectedKey={check.selectedKey}
        flash={check.flash}
        onSelect={check.setSelectedKey}
        onQuantity={check.setQuantity}
        onRemove={check.remove}
        onUndo={check.undo}
        canUndo={check.canUndo}
        onOptions={onEditOptions}
        onClear={() => {
          check.clear();
          setFlow({ step: "check" });
        }}
        onClose={wide ? undefined : () => setSheetOpen(false)}
        footer={footer}
      />
    );

  return (
    <div
      style={{ "--pos-chrome": "6.375rem" } as React.CSSProperties}
      className="flex flex-col md:flex-row lg:h-[calc(100dvh-var(--pos-chrome))] lg:overflow-hidden"
    >
      {/* Receipt paper: flush left, square, no gap. Mounted here at >=768px, in the Sheet below it. */}
      <aside
        aria-label="Check"
        className="hidden shrink-0 border-r border-border bg-surface md:sticky md:top-0 md:block md:h-[calc(100dvh-var(--pos-chrome))] md:w-[17rem] lg:static lg:h-full lg:w-[22rem] xl:w-[24rem]"
      >
        {wide && panel}
      </aside>

      {/* Menu board */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {options && wide ? (
          <PosOptions
            item={options.item}
            initial={options.initial}
            mode={options.lineKey ? "edit" : "add"}
            asSheet={false}
            onSubmit={onOptionsSubmit}
            onCancel={() => setOptions(null)}
          />
        ) : (
          <>
            <div className="shrink-0">
              <CategoryRail sections={sections} selectedId={section.id} onSelect={setSectionId} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DishGrid items={section.items} onSelect={onDish} />
            </div>
          </>
        )}
      </main>

      {/* Phone: sticky bar opens the same CheckPanel in a bottom Sheet. */}
      {!wide && (
        <>
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-[0.9375rem] font-semibold tabular-nums">
              {flow.step === "closed"
                ? "Sale closed"
                : `${check.count} ${check.count === 1 ? "item" : "items"} · ${formatCents(totalCents)}`}
            </p>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="h-12 rounded-xl bg-foreground px-5 text-[1.0625rem] font-bold text-background outline-none focus-visible:ring-4 focus-visible:ring-foreground/30"
            >
              Review check
            </button>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] gap-0 rounded-t-3xl border-0 bg-surface p-0 shadow-none">
              <SheetTitle className="sr-only">Check</SheetTitle>
              <SheetDescription className="sr-only">Review the check and take payment.</SheetDescription>
              <div className="h-[85dvh] min-h-0">{panel}</div>
            </SheetContent>
          </Sheet>
          {options && (
            <PosOptions
              item={options.item}
              initial={options.initial}
              mode={options.lineKey ? "edit" : "add"}
              asSheet
              onSubmit={onOptionsSubmit}
              onCancel={() => setOptions(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
