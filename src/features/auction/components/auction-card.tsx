import Link from "next/link";

import { formatDateTime, formatMoney } from "@/shared/lib/format";
import { Thumbnail } from "@/shared/ui/thumbnail";

import type { AuctionSummary } from "../model/auction";
import { AuctionStatusBadge } from "./auction-status-badge";
import { Countdown } from "./countdown";

export function AuctionCard({ auction }: { auction: AuctionSummary }) {
  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group block overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-line-strong"
    >
      <Thumbnail src={auction.imageUrl} alt={auction.title} />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-fg">
            {auction.title}
          </h3>
          <AuctionStatusBadge status={auction.status} />
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-subtle">Güncel fiyat</p>
            <p className="text-lg font-semibold tabular text-fg">
              {formatMoney(auction.currentPrice)}
            </p>
          </div>
          <p className="text-xs text-subtle">
            {auction.bidCount} teklif
            {auction.highestBidderName && ` · ${auction.highestBidderName}`}
          </p>
        </div>

        <p className="text-xs text-subtle">
          {auction.status === "Live" ? (
            <>
              Kalan süre <Countdown target={auction.endsAt} />
            </>
          ) : auction.status === "Scheduled" ? (
            <>Başlangıç {formatDateTime(auction.startsAt)}</>
          ) : (
            <>Bitiş {formatDateTime(auction.endsAt)}</>
          )}
        </p>
      </div>
    </Link>
  );
}
