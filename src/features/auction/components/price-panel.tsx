import { formatMoney } from "@/shared/lib/format";
import { Card, CardBody, Stat } from "@/shared/ui";

import type { AuctionDetail } from "../model/auction";
import { Countdown } from "./countdown";

export function PricePanel({
  auction,
  isLeading,
  viewerCount,
  serverOffsetMs,
}: {
  auction: AuctionDetail;
  isLeading: boolean;
  viewerCount: number;
  serverOffsetMs: number;
}) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-subtle">
            Güncel fiyat
          </p>
          <p
            // Keyed on the price so a new value replays the flash animation.
            key={auction.currentPrice}
            className="mt-1 inline-block rounded px-1 text-4xl font-semibold tabular text-fg animate-price-flash"
          >
            {formatMoney(auction.currentPrice)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {auction.highestBidderName
              ? isLeading
                ? "En yüksek teklif sizde"
                : `Önde: ${auction.highestBidderName}`
              : "Henüz teklif yok"}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Min. teklif" value={formatMoney(auction.minimumNextBid)} />
          <Stat label="Teklif" value={auction.bidCount} />
          <Stat
            label="Kalan süre"
            value={
              <Countdown target={auction.endsAt} offsetMs={serverOffsetMs} />
            }
          />
          <Stat label="İzleyici" value={viewerCount} />
        </dl>
      </CardBody>
    </Card>
  );
}
