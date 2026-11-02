import { Trophy } from "lucide-react";

import { formatMoney, maskEmail } from "@/shared/lib/format";
import { Alert } from "@/shared/ui";

import type { AuctionEndedEvent } from "../model/hub-events";

export function AuctionResult({
  ended,
  viewerId,
}: {
  ended: AuctionEndedEvent;
  viewerId: string | null;
}) {
  if (!ended.winnerId) {
    return (
      <Alert tone="info" title="Açık artırma sona erdi">
        Bu açık artırmaya teklif gelmedi.
      </Alert>
    );
  }

  const won = viewerId !== null && ended.winnerId === viewerId;

  if (won) {
    return (
      <div
        role="status"
        className="relative animate-scale-in overflow-hidden rounded-card bg-gradient-brand bg-[length:200%_200%] p-5 text-white shadow-glow animate-gradient-pan"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 animate-float place-items-center rounded-2xl bg-white/20">
            <Trophy className="size-6" />
          </span>
          <div>
            <p className="text-lg font-semibold">Tebrikler, kazandınız!</p>
            <p className="text-sm text-white/85">
              {formatMoney(ended.finalPrice)} ile en yüksek teklif sizindi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert tone="info" title="Açık artırma sona erdi">
      Kazanan {ended.winnerName ? maskEmail(ended.winnerName) : "belirlendi"} ·{" "}
      {formatMoney(ended.finalPrice)} · {ended.bidCount} teklif
    </Alert>
  );
}
