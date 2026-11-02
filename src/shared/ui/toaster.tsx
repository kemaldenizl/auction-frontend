"use client";

import { CircleCheck, CircleX, Info } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/cn";

import {
  dismissToast,
  getToastsServerSnapshot,
  getToastsSnapshot,
  subscribeToToasts,
  type ToastTone,
} from "./toast-store";

const TONES: Record<ToastTone, { accent: string; Icon: typeof Info }> = {
  success: { accent: "text-success", Icon: CircleCheck },
  danger: { accent: "text-danger", Icon: CircleX },
  info: { accent: "text-info", Icon: Info },
};

export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribeToToasts,
    getToastsSnapshot,
    getToastsServerSnapshot,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => {
        const { accent, Icon } = TONES[toast.tone];

        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="pointer-events-auto flex max-w-md bg-surface animate-scale-in items-center gap-2.5 rounded-2xl border border-line px-4 py-3 text-left text-sm font-medium text-fg shadow-lift"
          >
            <Icon aria-hidden className={cn("size-4 shrink-0", accent)} />
            {toast.message}
          </button>
        );
      })}
    </div>
  );
}
