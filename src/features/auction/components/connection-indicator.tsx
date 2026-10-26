import { Badge, type BadgeTone } from "@/shared/ui";

import type { ConnectionStatus } from "../model/auction-room";

const PRESENTATION: Record<
  ConnectionStatus,
  { label: string; tone: BadgeTone }
> = {
  connecting: { label: "Bağlanıyor", tone: "info" },
  connected: { label: "Bağlı", tone: "success" },
  reconnecting: { label: "Yeniden bağlanıyor", tone: "warning" },
  disconnected: { label: "Bağlantı kesildi", tone: "danger" },
  error: { label: "Bağlantı hatası", tone: "danger" },
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const { label, tone } = PRESENTATION[status];

  return (
    <Badge tone={tone} pulse={status !== "connected"}>
      <span className="sr-only">SignalR durumu: </span>
      {label}
    </Badge>
  );
}
