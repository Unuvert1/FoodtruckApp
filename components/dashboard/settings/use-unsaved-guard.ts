"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Warns before a dirty settings form is thrown away. Tab close / reload use
// beforeunload; in-app navigation is caught by one capture-phase click
// listener on links, because the App Router has no "about to navigate" event.
// Browser Back isn't intercepted (fighting the history stack isn't worth it).
// A page can have several dirty forms, so the listeners are shared and
// installed once, while any form is dirty.

const MESSAGE = "You have unsaved changes. Leave without saving?";
let dirtyCount = 0;
let push: ((href: string) => void) | null = null;

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}

function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
  const url = new URL(link.href, window.location.href);
  const here = window.location;
  if (url.origin !== here.origin || (url.pathname === here.pathname && url.search === here.search)) return; // other sites and #anchors
  e.preventDefault();
  e.stopImmediatePropagation(); // keep Next's Link from navigating before we've asked
  if (window.confirm(MESSAGE)) {
    // Navigating away unmounts the forms, but be explicit so the guard can't linger.
    push?.(url.pathname + url.search + url.hash);
  }
}

function install() {
  window.addEventListener("beforeunload", onBeforeUnload);
  document.addEventListener("click", onClick, true);
}

function uninstall() {
  window.removeEventListener("beforeunload", onBeforeUnload);
  document.removeEventListener("click", onClick, true);
}

export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();

  useEffect(() => {
    push = (href) => router.push(href);
  }, [router]);

  useEffect(() => {
    if (!dirty) return;
    if (dirtyCount++ === 0) install();
    return () => {
      if (--dirtyCount === 0) uninstall();
    };
  }, [dirty]);
}
