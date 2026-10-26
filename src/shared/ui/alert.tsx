import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, string> = {
  info: "border-info/30 bg-info-soft text-info",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
};

export function Alert({
  tone = "info",
  title,
  action,
  /** `alert` interrupts the screen reader; `status` waits for a pause. */
  role = "status",
  className,
  children,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm",
        TONES[tone],
        className,
      )}
    >
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-current/90">{children}</div>}
      </div>
      {action}
    </div>
  );
}
