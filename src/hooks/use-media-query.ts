"use client";

import { useSyncExternalStore } from "react";

function createMediaQueryStore(query: string) {
  function subscribe(callback: () => void) {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  }

  function getSnapshot() {
    return window.matchMedia(query).matches;
  }

  function getServerSnapshot() {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

export function useMediaQuery(query: string): boolean {
  const store = createMediaQueryStore(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
