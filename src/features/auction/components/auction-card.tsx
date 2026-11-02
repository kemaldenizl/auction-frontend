import { ArrowUpRight, CalendarClock, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatMoney, maskEmail } from "@/shared/lib/format";
import { Thumbnail } from "@/shared/ui";

import type { AuctionSummary } from "../model/auction";
import { AuctionStatusBadge } from "./auction-status-badge";
import { Countdown } from "./countdown";

export function AuctionCard({
  auction,
  style,
}: {
  auction: AuctionSummary;
  /** Entrance delay from the parent list. */
  style?: CSSProperties;
}) {
  const live = auction.status === "Live";

  return (
    <Link
      href={`/auctions/${auction.id}`}
      style={style}
      className={cn(
        "group relative block animate-fade-up overflow-hidden rounded-card border border-line bg-surface shadow-card stagger",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-lift",
        live ? "hover:border-live/40" : "hover:border-brand/30",
      )}
    >
      <div className="relative">
        <Thumbnail src={auction.imageUrl} alt={auction.title} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/55 to-transparent" />

        <AuctionStatusBadge
          status={auction.status}
          className="absolute top-3 left-3 shadow-card"
        />

        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          {live ? (
            <>
              <Timer className="size-3.5" />
              <Countdown target={auction.endsAt} />
            </>
          ) : auction.status === "Scheduled" ? (
            <>
              <CalendarClock className="size-3.5" />
              {formatDateTime(auction.startsAt)}
            </>
          ) : (
            formatDateTime(auction.endsAt)
          )}
        </span>

        <span className="absolute top-3 right-3 grid size-8 translate-y-1 place-items-center rounded-full bg-white/90 text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-1 font-semibold text-fg">{auction.title}</h3>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-subtle">
              {auction.bidCount > 0 ? "Güncel fiyat" : "Başlangıç fiyatı"}
            </p>
            <p className="text-xl font-semibold tabular text-fg">
              {formatMoney(auction.currentPrice)}
            </p>
          </div>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <TrendingUp className="size-3.5" />
            {auction.bidCount} teklif
          </p>
        </div>

        <p className="truncate text-xs text-subtle">
          {auction.highestBidderName
            ? `Önde: ${maskEmail(auction.highestBidderName)}`
            : "İlk teklifi siz verin"}
        </p>
      </div>
    </Link>
  );
}
