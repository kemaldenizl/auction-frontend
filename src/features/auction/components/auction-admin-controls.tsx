"use client";

import { useState } from "react";

import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import type { AuctionStatus } from "../model/auction";

type Action = "start" | "cancel";

/**
 * Operator actions over REST.
 *
 * Nothing is written into local state afterwards on purpose: the server
 * broadcasts `AuctionStarted` / `AuctionCancelled` and the room updates from
 * the hub. It is the clearest demonstration that REST and the hub share one
 * set of rules and one event stream.
 */
export function AuctionAdminControls({
  auctionId,
  status,
}: {
  auctionId: string;
  status: AuctionStatus;
}) {
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setPending(action);
    setError(null);

    try {
      await (action === "start"
        ? auctionApi.startAuction(auctionId)
        : auctionApi.cancelAuction(auctionId));
    } catch (cause) {
      setError(
        isApiError(cause)
          ? `${cause.errorCode}: ${cause.message}`
          : "İşlem başarısız.",
      );
    } finally {
      setPending(null);
    }
  }

  const closed = status === "Ended" || status === "Cancelled";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={pending === "start"}
          disabled={status !== "Scheduled" || pending !== null}
          onClick={() => run("start")}
        >
          Başlat
        </Button>
        <Button
          variant="danger"
          size="sm"
          loading={pending === "cancel"}
          disabled={closed || pending !== null}
          onClick={() => run("cancel")}
        >
          İptal et
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
