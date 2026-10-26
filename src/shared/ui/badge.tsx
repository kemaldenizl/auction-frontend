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
  neutral: "bg-surface-muted text-muted",
  brand: "bg-brand-soft text-brand",
  live: "bg-live-soft text-live",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  /** Adds a breathing dot — used for the "Canlı" state. */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
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
