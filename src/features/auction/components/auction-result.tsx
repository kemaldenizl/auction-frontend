import { formatMoney } from "@/shared/lib/format";
import { Alert } from "@/shared/ui";

import type { AuctionEndedEvent } from "../model/hub-events";

export function AuctionResult({
  ended,
  bidderId,
}: {
  ended: AuctionEndedEvent;
  bidderId: string;
}) {
  if (!ended.winnerId) {
    return (
      <Alert tone="info" title="Açık arttırma sona erdi">
        Hiç teklif gelmedi.
      </Alert>
    );
  }

  const won = ended.winnerId === bidderId;

  return (
    <Alert
      tone={won ? "success" : "info"}
      title={won ? "Kazandınız!" : "Açık arttırma sona erdi"}
    >
      {won ? "Kazanan sizsiniz" : `Kazanan: ${ended.winnerName}`} ·{" "}
      {formatMoney(ended.finalPrice)} · {ended.bidCount} teklif
    </Alert>
  );
}
