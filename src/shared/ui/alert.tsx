import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, { box: string; Icon: typeof Info }> = {
  info: { box: "border-info/25 bg-info-soft text-info", Icon: Info },
  success: {
    box: "border-success/25 bg-success-soft text-success",
    Icon: CircleCheck,
  },
  warning: {
    box: "border-warning/25 bg-warning-soft text-warning",
    Icon: TriangleAlert,
  },
  danger: { box: "border-danger/25 bg-danger-soft text-danger", Icon: CircleX },
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
  const { box, Icon } = TONES[tone];

  return (
    <div
      role={role}
      className={cn(
        "flex animate-fade-up flex-wrap items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
        box,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className="text-current/90">{children}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}
