import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AuctionBoard,
  AuctionBoardSkeleton,
} from "@/features/auction/components/auction-board";
import { AuctionStatusFilter } from "@/features/auction/components/auction-status-filter";
import { isAuctionStatus } from "@/features/auction/model/auction";
import { readPage, readString } from "@/shared/lib/search-params";
import { PageHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Açık arttırmalar" };

export default function AuctionsPage(props: PageProps<"/auctions">) {
  return (
    <>
      <PageHeader
        title="Açık arttırmalar"
        description="Durum filtresi ve sayfa numarası URL'de tutulur."
      />

      {/* Resolving searchParams inside JSX keeps the page itself synchronous,
          so everything outside this boundary stays in the static shell. */}
      <Suspense fallback={<AuctionBoardSkeleton />}>
        {props.searchParams.then((searchParams) => {
          const raw = readString(searchParams.status);
          const status = raw && isAuctionStatus(raw) ? raw : undefined;

          return (
            <div className="space-y-6">
              <AuctionStatusFilter selected={status} />
              <AuctionBoard
                status={status}
                page={readPage(searchParams.page)}
              />
            </div>
          );
        })}
      </Suspense>
    </>
  );
}
