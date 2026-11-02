"use client";

import { useNow } from "@/shared/hooks/use-now";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "@/shared/lib/format";

const PLACEHOLDER = "--:--";
/** Below this the timer turns red, so the last minute reads as urgent. */
const URGENT_MS = 60_000;

/**
 * Counts down to a server timestamp.
 *
 * `endsAt` is UTC from the server and the viewer's clock may be off, so the
 * measured offset (see `AuctionRoomState.serverOffsetMs`) is applied before
 * subtracting. Renders a placeholder until mounted to keep hydration clean.
 */
export function Countdown({
  target,
  offsetMs = 0,
  className,
}: {
  target: string;
  offsetMs?: number;
  className?: string;
}) {
  const now = useNow();
  const endsAt = Date.parse(target);

  if (Number.isNaN(endsAt)) return null;

  const remaining = now === null ? null : Math.max(0, endsAt + offsetMs - now);
  const urgent = remaining !== null && remaining > 0 && remaining < URGENT_MS;

  return (
    <time
      dateTime={target}
      className={cn(
        "tabular transition-colors duration-500",
        urgent && "text-live",
        className,
      )}
    >
      {remaining === null ? PLACEHOLDER : formatDuration(remaining)}
    </time>
  );
}
