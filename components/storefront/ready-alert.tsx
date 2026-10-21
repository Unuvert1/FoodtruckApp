"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { becameReady, awaitingReady, notificationPermission, readyTitle, type NotificationPermissionState } from "@/lib/ready-alert";
import { Button } from "@/components/ui/button";

const BACKGROUND_POLL_MS = 20_000;

/**
 * Three ways to find out the order is ready without staring at the page:
 *  - the tab title changes (always, no permission needed);
 *  - if the customer opts in: the phone vibrates and, where the browser allows it, a notification appears;
 *  - while opted in, the page keeps checking even when its tab is in the background (the normal
 *    refresh pauses there). Browsers slow background timers down, so this is best effort.
 * Nothing is asked of the customer until they press the button.
 */
export function ReadyAlert({
  orderId,
  orderNumber,
  truckName,
  status,
}: {
  orderId: string;
  orderNumber: string;
  truckName: string;
  status: string;
}) {
  const router = useRouter();
  const storageKey = `ready-alert:v1:${orderId}`;
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");
  const previousStatus = useRef<string | null>(null);

  // Read after mount so the server and browser render the same thing first.
  useEffect(() => {
    setPermission(notificationPermission());
    try {
      if (sessionStorage.getItem(storageKey) === "1") setEnabled(true);
    } catch {
      // Storage blocked: the choice just won't survive a reload.
    }
  }, [storageKey]);

  // The tab title, for as long as the order is ready.
  useEffect(() => {
    if (status !== "READY") return;
    const before = document.title;
    document.title = readyTitle(orderNumber, truckName);
    return () => {
      document.title = before;
    };
  }, [status, orderNumber, truckName]);

  // The moment it becomes ready while this page is open.
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = status;
    if (!enabled || !becameReady(before, status)) return;
    try {
      navigator.vibrate?.([200, 100, 200, 100, 200]);
    } catch {
      // Not supported here.
    }
    if (notificationPermission() === "granted") {
      try {
        new Notification(`Order ${orderNumber} is ready`, {
          body: `${truckName}: your order is ready at the window.`,
          tag: `order-${orderId}`,
        });
      } catch {
        // Some phones only allow notifications from a service worker. The tab title still changes.
      }
    }
  }, [status, enabled, orderId, orderNumber, truckName]);

  // Keep checking while the tab is in the background, only for customers who asked to be alerted.
  useEffect(() => {
    if (!enabled || !awaitingReady(status)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") router.refresh();
    }, BACKGROUND_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, status, router]);

  if (!awaitingReady(status)) return null;

  async function turnOn() {
    // Switch on straight away. The browser's permission prompt can sit unanswered, and the button must not look dead meanwhile.
    setEnabled(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage blocked: the choice just won't survive a reload.
    }
    if (notificationPermission() === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // Old browsers use a callback form; either way we read the result below.
      }
      setPermission(notificationPermission());
    }
  }

  function turnOff() {
    setEnabled(false);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // See above.
    }
  }

  const hint = !enabled
    ? "Keep this page open. We'll ask before sending a notification."
    : permission === "granted"
      ? "Keep this page open. This tab's title will change and we'll send a notification."
      : permission === "denied"
        ? "Notifications are blocked for this site in your browser. We'll change this tab's title and buzz your phone if it allows it."
        : "We'll change this tab's title and buzz your phone if it allows it.";

  return (
    <section aria-label="Ready alert" className="px-4 pt-6">
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
        <Bell aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{enabled ? "We'll alert you when it's ready" : "Get an alert when it's ready"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={enabled ? turnOff : turnOn}
          className="h-11 shrink-0 rounded-xl px-4 text-sm font-semibold"
        >
          {enabled ? "Turn off" : "Turn on"}
        </Button>
      </div>
    </section>
  );
}
