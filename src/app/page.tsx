import { Suspense } from "react";

import {
  AuctionBoard,
  AuctionBoardSkeleton,
} from "@/features/auction/components/auction-board";
import { PageHeader } from "@/shared/ui";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Canlı açık arttırmalar"
        description="Bir odaya girdiğinizde JoinAuction anlık durumu döner, sonrasını hub taşır."
      />

      {/* Uncached reads stream in behind their own boundary, so the shell and
          the headings paint immediately. */}
      <Suspense fallback={<AuctionBoardSkeleton count={3} />}>
        <AuctionBoard status="Live" pageSize={6} paginated={false} />
      </Suspense>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-fg">
        Yakında başlayacak
      </h2>
      <Suspense fallback={<AuctionBoardSkeleton count={3} />}>
        <AuctionBoard status="Scheduled" pageSize={3} paginated={false} />
      </Suspense>
    </>
  );
}
