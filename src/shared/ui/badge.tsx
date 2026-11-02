import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "live"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted ring-line",
  brand: "bg-brand-soft text-brand ring-brand/20",
  live: "bg-live-soft text-live ring-live/25",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
};

export function Badge({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  /** Adds a breathing dot with an expanding ring — used for "Canlı". */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset [&_svg]:size-3",
        TONES[tone],
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-current animate-live-pulse"
        />
      )}
      {children}
    </span>
  );
}
