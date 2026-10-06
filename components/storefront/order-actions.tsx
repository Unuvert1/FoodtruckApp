"use client";

import { useState } from "react";
import { CalendarPlus, Check, Link2 } from "lucide-react";
import { buildPickupIcs } from "@/lib/calendar";

type Props = {
  orderId: string;
  orderNumber: string;
  truckName: string;
  pickupAt: string; // ISO instant
  locationName: string;
  address: string;
};

const buttonClass =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold ring-1 ring-border outline-none hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-brand";

/** Keeps the pickup time from getting lost: copy the order link, or add it to a calendar. */
export function OrderActions({ orderId, orderNumber, truckName, pickupAt, locationName, address }: Props) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link copied.");
    } catch {
      setMessage("Couldn't copy. Copy the address from your browser instead.");
    }
  }

  function addToCalendar() {
    const ics = buildPickupIcs({
      uid: `order-${orderId}@foodtruckapp`,
      title: `Pickup from ${truckName} (order ${orderNumber})`,
      location: `${locationName}, ${address}`,
      description: `Order ${orderNumber}. Show this number at the pickup window.`,
      startsAt: pickupAt,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pickup-${orderNumber}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Calendar file downloaded.");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copyLink} className={buttonClass}>
          {message === "Link copied." ? <Check aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
          Copy order link
        </button>
        <button type="button" onClick={addToCalendar} className={buttonClass}>
          <CalendarPlus aria-hidden className="size-4" />
          Add pickup to calendar
        </button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
