"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { errorMessage } from "@/shared/api";
import { useAsyncData } from "@/shared/hooks/use-async-data";
import {
  ApiErrorPanel,
  Button,
  buttonClassName,
  toast,
} from "@/shared/ui";

import { MAX_BID_HISTORY, auctionApi } from "../api/auction-api";
import type { Bid } from "../model/auction";
import {
  AuctionRoomSkeleton,
  AuctionShowcase,
  BackToAuctions,
} from "./auction-room";
import { BidFeed } from "./bid-feed";
import { PricePanel } from "./price-panel";

/**
 * What a signed-out visitor sees.
 *
 * Auction details are public, so the page still shows real figures; only the
 * live updates and bidding need an account.
 */
export function AuctionPreview({ auctionId }: { auctionId: string }) {
  const load = useCallback(
    (signal: AbortSignal) => auctionApi.getAuction(auctionId, signal),
    [auctionId],
  );
  const { data: auction, error } = useAsyncData(load);

  const [history, setHistory] = useState<Bid[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      setHistory(await auctionApi.listBids(auctionId, MAX_BID_HISTORY));
    } catch (cause) {
      toast(errorMessage(cause, "Teklif geçmişi yüklenemedi."), "danger");
    } finally {
      setLoadingHistory(false);
    }
  }

  if (error) return <ApiErrorPanel problem={error.problem} />;
  if (!auction) return <AuctionRoomSkeleton />;

  const bids = history ?? auction.recentBids;
  const loginHref = `/login?next=${encodeURIComponent(`/auctions/${auctionId}`)}`;

  return (
    <div className="space-y-6">
      <BackToAuctions />

      <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <AuctionShowcase auction={auction} />
          <div className="space-y-3">
            <BidFeed bids={bids} viewerId={null} />
            {history === null && auction.bidCount > bids.length && (
              <Button
                variant="secondary"
                size="sm"
                loading={loadingHistory}
                onClick={loadHistory}
              >
                Tüm teklifleri göster
              </Button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <PricePanel auction={auction} isLeading={false}>
            <div className="space-y-3 rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 p-4 text-center">
              <p className="text-sm text-muted">
                Teklif vermek ve fiyatı canlı izlemek için giriş yapın.
              </p>
              <Link href={loginHref} className={buttonClassName({ size: "lg", className: "w-full" })}>
                <LogIn /> Giriş yap ve teklif ver
              </Link>
              <p className="text-xs text-subtle">
                Hesabınız yok mu?{" "}
                <Link href="/register" className="font-medium text-brand hover:underline">
                  Ücretsiz kayıt olun
                </Link>
              </p>
            </div>
          </PricePanel>
        </div>
      </div>
    </div>
  );
}
