"use client";

import type { Bidder } from "@/features/bidder/model/bidder";
import { Alert, Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";

import { useAuctionRoom } from "../hooks/use-auction-room";
import { AuctionAdminControls } from "./auction-admin-controls";
import { AuctionResult } from "./auction-result";
import { AuctionStatusBadge } from "./auction-status-badge";
import { BidFeed } from "./bid-feed";
import { BidForm } from "./bid-form";
import { ConnectionIndicator } from "./connection-indicator";
import { HubEventLog } from "./hub-event-log";
import { OutbidAlert } from "./outbid-alert";
import { PricePanel } from "./price-panel";

function bidDisabledReason(
  isLive: boolean,
  canBid: boolean,
): string | undefined {
  if (!isLive) return "Açık arttırma canlı değil, teklif alınmıyor.";
  if (!canBid) return "Bağlantı kurulana kadar teklif gönderilemez.";
  return undefined;
}

export function AuctionRoom({
  auctionId,
  bidder,
}: {
  auctionId: string;
  bidder: Bidder;
}) {
  const room = useAuctionRoom(auctionId, bidder);
  const { auction } = room;

  if (!auction) {
    return (
      <div className="space-y-4">
        <ConnectionIndicator status={room.connection} />
        {room.connectionError ? (
          <Alert role="alert" tone="danger" title="Hub bağlantısı kurulamadı">
            {room.connectionError}
          </Alert>
        ) : (
          <AuctionRoomSkeleton />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            {auction.title}
          </h1>
          {auction.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted">
              {auction.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AuctionStatusBadge status={auction.status} />
          <ConnectionIndicator status={room.connection} />
        </div>
      </header>

      {room.connection === "reconnecting" && (
        <Alert tone="warning" title="Bağlantı yenileniyor">
          Yeniden bağlanıldığında odaya tekrar katılınır; bu arada kaçan
          teklifler o anın anlık görüntüsüyle birlikte gelir.
        </Alert>
      )}

      {room.ended && (
        <AuctionResult ended={room.ended} bidderId={bidder.id} />
      )}

      {room.outbid && (
        <OutbidAlert outbid={room.outbid} onDismiss={room.dismissOutbid} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <PricePanel
            auction={auction}
            isLeading={room.isLeading}
            viewerCount={room.viewerCount}
            serverOffsetMs={room.serverOffsetMs}
          />

          <Card>
            <CardHeader
              title="Teklif ver"
              description="Hub üzerinden gönderilir; sonuç olay olarak döner."
            />
            <CardBody>
              <BidForm
                minimumNextBid={auction.minimumNextBid}
                minimumIncrement={auction.minimumIncrement}
                disabled={!room.canBid}
                disabledReason={bidDisabledReason(room.isLive, room.canBid)}
                rejection={room.rejection}
                onSubmit={room.placeBid}
                onDismissRejection={room.dismissRejection}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Operatör"
              description="REST ile yapılan değişiklik hub olayı olarak geri döner."
            />
            <CardBody>
              <AuctionAdminControls
                auctionId={auction.id}
                status={auction.status}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <BidFeed bids={room.bids} bidderId={bidder.id} />
          <HubEventLog entries={room.log} />
        </div>
      </div>
    </div>
  );
}

export function AuctionRoomSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-56" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
