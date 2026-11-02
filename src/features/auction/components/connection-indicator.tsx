import { cn } from "@/shared/lib/cn";

import type { ConnectionStatus } from "../model/auction-room";

const PRESENTATION: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: "Bağlanıyor", dot: "bg-info" },
  connected: { label: "Canlı bağlantı", dot: "bg-success" },
  reconnecting: { label: "Bağlantı yenileniyor", dot: "bg-warning" },
  disconnected: { label: "Bağlantı koptu", dot: "bg-danger" },
  error: { label: "Bağlanılamadı", dot: "bg-danger" },
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const { label, dot } = PRESENTATION[status];

  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-medium text-muted"
    >
      <span className="relative flex size-2">
        {status !== "connected" && status !== "error" && (
          <span
            aria-hidden
            className={cn("absolute inset-0 animate-ping rounded-full opacity-60", dot)}
          />
        )}
        <span className={cn("relative size-2 rounded-full", dot)} />
      </span>
      {label}
    </span>
  );
}
