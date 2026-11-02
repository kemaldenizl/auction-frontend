import { Crown, Eye, Gavel, Timer, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { formatMoney, maskEmail } from "@/shared/lib/format";
import { Stat } from "@/shared/ui";

import type { AuctionDetail } from "../model/auction";
import { Countdown } from "./countdown";

export function PricePanel({
  auction,
  isLeading,
  viewerCount,
  serverOffsetMs,
  children,
}: {
  auction: AuctionDetail;
  isLeading: boolean;
  viewerCount?: number;
  serverOffsetMs?: number;
  /** The bid form, rendered under the figures. */
  children?: ReactNode;
}) {
  const live = auction.status === "Live";

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* A thin animated bar marks a live auction. */}
      {live && (
        <div className="h-1 bg-gradient-brand bg-[length:200%_100%] animate-gradient-pan" />
      )}

      <div className="space-y-6 p-6">
        <div>
          <p className="text-xs font-medium text-subtle">
            {auction.bidCount > 0 ? "Güncel fiyat" : "Başlangıç fiyatı"}
          </p>
          <p
            // Keyed on the price so every new bid replays the pop.
            key={auction.currentPrice}
            className="mt-1 inline-block origin-left animate-price-pop text-5xl font-semibold tracking-tight tabular text-gradient"
          >
            {formatMoney(auction.currentPrice)}
          </p>
          <p
            className={
              isLeading
                ? "mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                : "mt-2 text-sm text-muted"
            }
          >
            {isLeading && <Crown className="size-3.5" />}
            {auction.highestBidderName
              ? isLeading
                ? "En yüksek teklif sizde"
                : `Önde: ${maskEmail(auction.highestBidderName)}`
              : "Henüz teklif yok — ilk teklifi siz verin"}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-muted/60 p-4">
          <Stat
            icon={<Timer />}
            label={live ? "Kalan süre" : "Bitiş"}
            value={
              <Countdown target={auction.endsAt} offsetMs={serverOffsetMs} />
            }
          />
          <Stat
            icon={<Gavel />}
            label="En az teklif"
            value={formatMoney(auction.minimumNextBid)}
          />
          <Stat icon={<TrendingUp />} label="Teklif" value={auction.bidCount} />
          {viewerCount !== undefined && (
            <Stat icon={<Eye />} label="İzleyen" value={viewerCount} />
          )}
        </dl>

        {children}
      </div>
    </div>
  );
}
