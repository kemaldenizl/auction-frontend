import { Ban, CalendarClock, Flag } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, type BadgeTone } from "@/shared/ui";

import type { AuctionStatus } from "../model/auction";

const PRESENTATION: Record<
  AuctionStatus,
  { label: string; tone: BadgeTone; icon?: ReactNode; pulse?: boolean }
> = {
  Scheduled: { label: "Yakında", tone: "info", icon: <CalendarClock /> },
  Live: { label: "Canlı", tone: "live", pulse: true },
  Ended: { label: "Sona erdi", tone: "neutral", icon: <Flag /> },
  Cancelled: { label: "İptal edildi", tone: "danger", icon: <Ban /> },
};

export function AuctionStatusBadge({
  status,
  className,
}: {
  status: AuctionStatus;
  className?: string;
}) {
  const { label, tone, icon, pulse } = PRESENTATION[status];
  return (
    <Badge tone={tone} pulse={pulse} className={className}>
      {icon}
      {label}
    </Badge>
  );
}

export function auctionStatusLabel(status: AuctionStatus): string {
  return PRESENTATION[status].label;
}
