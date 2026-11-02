"use client";

import { Ban, Play, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { errorMessage } from "@/shared/api";
import { Button, Card, CardBody, CardHeader, ConfirmDialog, toast } from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import type { AuctionStatus } from "../model/auction";

type Action = "start" | "cancel";

/**
 * Operator actions, gated on `auctions.manage`.
 *
 * Nothing is written into local state afterwards on purpose: the server
 * broadcasts the change to everyone in the room, this viewer included, and
 * the room updates from that.
 */
export function AuctionAdminControls({
  auctionId,
  status,
}: {
  auctionId: string;
  status: AuctionStatus;
}) {
  const [pending, setPending] = useState<Action | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function run(action: Action) {
    setPending(action);

    try {
      await (action === "start"
        ? auctionApi.startAuction(auctionId)
        : auctionApi.cancelAuction(auctionId));
      toast(
        action === "start"
          ? "Açık artırma başlatıldı."
          : "Açık artırma iptal edildi.",
      );
    } catch (cause) {
      toast(errorMessage(cause, "İşlem tamamlanamadı."), "danger");
    } finally {
      setPending(null);
      setConfirmCancel(false);
    }
  }

  const closed = status === "Ended" || status === "Cancelled";

  return (
    <PermissionGate permission={PERMISSION.auctionsManage}>
      <Card>
        <CardHeader
          icon={<ShieldCheck />}
          title="Yönetici işlemleri"
          description="Değişiklik odadaki herkese anında yansır."
        />
        <CardBody className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={pending === "start"}
            disabled={status !== "Scheduled" || pending !== null}
            onClick={() => run("start")}
          >
            <Play /> Hemen başlat
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={closed || pending !== null}
            onClick={() => setConfirmCancel(true)}
          >
            <Ban /> İptal et
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        title="Açık artırma iptal edilsin mi?"
        description="Bu işlem geri alınamaz; odadaki herkes iptali anında görür."
        confirmLabel="İptal et"
        destructive
        pending={pending === "cancel"}
        onConfirm={() => run("cancel")}
        onCancel={() => setConfirmCancel(false)}
      />
    </PermissionGate>
  );
}
