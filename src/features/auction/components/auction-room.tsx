"use client";

import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

import { env } from "@/shared/config/env";
import { formatMoney } from "@/shared/lib/format";
import {
  Alert,
  Button,
  Skeleton,
  Thumbnail,
  stagger,
  toast,
} from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import { useAuctionRoom } from "../hooks/use-auction-room";
import type { AuctionDetail } from "../model/auction";
import { AuctionAdminControls } from "./auction-admin-controls";
import { AuctionResult } from "./auction-result";
import { AuctionStatusBadge } from "./auction-status-badge";
import { BidFeed } from "./bid-feed";
import { BidForm } from "./bid-form";
import { ConnectionIndicator } from "./connection-indicator";
import { HubEventLog } from "./hub-event-log";
import { OutbidAlert } from "./outbid-alert";
import { PricePanel } from "./price-panel";

const CLOSED_REASON: Record<AuctionDetail["status"], string> = {
  Scheduled: "Bu açık artırma henüz başlamadı.",
  Live: "",
  Ended: "Bu açık artırma sona erdi.",
  Cancelled: "Bu açık artırma iptal edildi.",
};

export function BackToAuctions() {
  return (
    <Link
      href="/auctions"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-4" /> Tüm açık artırmalar
    </Link>
  );
}

/** Image, title and description — shared by the live room and the preview. */
export function AuctionShowcase({
  auction,
  viewerCount,
}: {
  auction: AuctionDetail;
  viewerCount?: number;
}) {
  return (
    <div className="animate-fade-up space-y-5">
      <div className="relative overflow-hidden rounded-card border border-line shadow-card">
        <Thumbnail
          src={auction.imageUrl}
          alt={auction.title}
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <AuctionStatusBadge status={auction.status} className="shadow-card" />
          {viewerCount !== undefined && viewerCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              <Eye className="size-3" /> {viewerCount} kişi izliyor
            </span>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">
          {auction.title}
        </h1>
        {auction.description && (
          <p className="mt-2 text-muted">{auction.description}</p>
        )}
      </div>
    </div>
  );
}

export function AuctionRoom({
  auctionId,
  sessionKey,
}: {
  auctionId: string;
  /** Rebuilds the connection when the signed-in session changes. */
  sessionKey: string;
}) {
  const room = useAuctionRoom(auctionId, { sessionKey });
  const { auction } = room;

  if (!auction) {
    return room.connection === "error" ? (
      <div className="space-y-6">
        <BackToAuctions />
        <Alert
          role="alert"
          tone="danger"
          title="Açık artırmaya bağlanılamadı"
          action={
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Tekrar dene
            </Button>
          }
        >
          İnternet bağlantınızı kontrol edip sayfayı yenileyin.
        </Alert>
      </div>
    ) : (
      <AuctionRoomSkeleton />
    );
  }

  // The live connection is the fast path. While it is down the same bid still
  // goes through as a regular request, under the same rules.
  const overHub = room.canBid;

  async function submitBid(amount: number) {
    if (overHub) {
      await room.placeBid(amount);
      return;
    }

    const { auction: updated } = await auctionApi.placeBid(auctionId, {
      amount,
    });
    toast(`Teklifiniz alındı: ${formatMoney(updated.currentPrice)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackToAuctions />
        <ConnectionIndicator status={room.connection} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <AuctionShowcase auction={auction} viewerCount={room.viewerCount} />
          <BidFeed bids={room.bids} viewerId={room.viewer?.id ?? null} />
        </div>

        {/* The bidding column follows the reader down the page. */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {room.connection === "reconnecting" && (
            <Alert tone="warning" title="Bağlantı yenileniyor">
              Birkaç saniye içinde kaldığınız yerden devam edeceksiniz.
            </Alert>
          )}

          {room.ended && (
            <AuctionResult ended={room.ended} viewerId={room.viewer?.id ?? null} />
          )}

          {!room.ended && auction.status === "Cancelled" && (
            <Alert tone="danger" title="Açık artırma iptal edildi">
              Bu ürün için teklif alınmıyor.
            </Alert>
          )}

          {room.outbid && (
            <OutbidAlert outbid={room.outbid} onDismiss={room.dismissOutbid} />
          )}

          <div className="animate-fade-up stagger" style={stagger(2)}>
            <PricePanel
              auction={auction}
              isLeading={room.isLeading}
              serverOffsetMs={room.serverOffsetMs}
            >
              <BidForm
                minimumNextBid={auction.minimumNextBid}
                minimumIncrement={auction.minimumIncrement}
                disabled={!room.isLive}
                disabledReason={CLOSED_REASON[auction.status]}
                rejection={room.rejection}
                onSubmit={submitBid}
                onDismissRejection={room.dismissRejection}
              />
            </PricePanel>
          </div>

          <AuctionAdminControls auctionId={auction.id} status={auction.status} />
        </div>
      </div>

      {/* Raw connection traffic, for whoever is developing the app only. */}
      {env.isDevelopment && <HubEventLog entries={room.log} />}
    </div>
  );
}

export function AuctionRoomSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <Skeleton className="aspect-[4/3] rounded-card" />
          <Skeleton className="h-8 w-2/3" />
        </div>
        <Skeleton className="h-[28rem] rounded-card" />
      </div>
    </div>
  );
}
