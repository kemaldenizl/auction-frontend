"use client";

import { useEffect, useState } from "react";

/**
 * A ticking `Date.now()`.
 *
 * Returns `null` until just after mount, so the server render and the first
 * client render produce identical markup — a timer seeded with a real
 * timestamp would hydrate with a mismatch. The first value is scheduled
 * immediately instead of a second later, and unlike an animation frame it
 * still arrives while the tab is in the background.
 */
export function useNow(intervalMs = 1_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
