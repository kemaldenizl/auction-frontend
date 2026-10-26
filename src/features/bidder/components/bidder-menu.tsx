"use client";

import { useState } from "react";

import { Button, Input, Skeleton } from "@/shared/ui";

import { useBidder } from "../hooks/use-bidder";

/**
 * Header control for the local identity. Opening a second tab and pressing
 * "Yeni kimlik" there is how you watch `Outbid` arrive: that tab bids under a
 * different `bidderId` while this one keeps the old one.
 */
export function BidderMenu() {
  const { bidder, rename, regenerate } = useBidder();

  // `null` means "not edited": the field shows the stored name. Deriving the
  // value this way avoids an effect that mirrors one state into another.
  const [draft, setDraft] = useState<string | null>(null);

  if (!bidder) {
    return <Skeleton className="h-9 w-48" />;
  }

  const value = draft ?? bidder.name;

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        rename(value);
      }}
    >
      <label htmlFor="bidder-name" className="sr-only">
        Teklif veren adı
      </label>
      <Input
        id="bidder-name"
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => rename(value)}
        className="h-9 w-36 py-1"
        aria-describedby="bidder-id"
      />
      <span
        id="bidder-id"
        className="hidden font-mono text-xs text-subtle sm:inline"
      >
        {bidder.id}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          regenerate();
          setDraft(null);
        }}
      >
        Yeni kimlik
      </Button>
    </form>
  );
}
