import { Badge, type BadgeTone } from "@/shared/ui";

import type { AuctionStatus } from "../model/auction";

const PRESENTATION: Record<
  AuctionStatus,
  { label: string; tone: BadgeTone; pulse?: boolean }
> = {
  Scheduled: { label: "Başlamadı", tone: "info" },
  Live: { label: "Canlı", tone: "live", pulse: true },
  Ended: { label: "Sona erdi", tone: "neutral" },
  Cancelled: { label: "İptal", tone: "danger" },
};

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  const { label, tone, pulse } = PRESENTATION[status];
  return (
    <Badge tone={tone} pulse={pulse}>
      {label}
    </Badge>
  );
}

export function auctionStatusLabel(status: AuctionStatus): string {
  return PRESENTATION[status].label;
}
