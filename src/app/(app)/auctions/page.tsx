import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AuctionBoard,
  AuctionBoardSkeleton,
  AuctionFilters,
} from "@/features/auction/components/auction-board";
import { isAuctionStatus } from "@/features/auction/model/auction";
import { readPage, readString } from "@/shared/lib/search-params";
import { PageHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Açık artırmalar" };

export default function AuctionsPage(props: PageProps<"/auctions">) {
  return (
    <>
      <PageHeader
        eyebrow="Keşfet"
        title="Açık artırmalar"
        description="Canlı olanlar en üstte, ardından bitişi en yakın olanlar."
      />

      {/* Resolving searchParams inside JSX keeps the page itself synchronous,
          so everything outside this boundary stays in the static shell. */}
      <Suspense fallback={<AuctionBoardSkeleton />}>
        {props.searchParams.then((searchParams) => {
          const rawStatus = readString(searchParams.status);
          const status =
            rawStatus && isAuctionStatus(rawStatus) ? rawStatus : undefined;
          const search = readString(searchParams.search);
          const productId = readString(searchParams.productId);

          return (
            <div className="space-y-8">
              <AuctionFilters
                status={status}
                search={search}
                productId={productId}
              />
              <AuctionBoard
                status={status}
                search={search}
                productId={productId}
                page={readPage(searchParams.page)}
              />
            </div>
          );
        })}
      </Suspense>
    </>
  );
}
