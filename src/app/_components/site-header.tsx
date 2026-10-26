import Link from "next/link";
import { Suspense } from "react";

import { BidderMenu } from "@/features/bidder/components/bidder-menu";
import { Container } from "@/shared/ui";

import { MainNav, MainNavFallback } from "./main-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fg">
          <span
            aria-hidden
            className="size-2 rounded-full bg-live animate-live-pulse"
          />
          Mezat
        </Link>

        {/* The active-link highlight reads the URL, so it streams in behind
            its own boundary rather than blocking the route. */}
        <Suspense fallback={<MainNavFallback />}>
          <MainNav />
        </Suspense>

        <div className="ml-auto">
          <BidderMenu />
        </div>
      </Container>
    </header>
  );
}
