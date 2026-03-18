"use client";

import { useTheme } from "next-themes";

export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}
