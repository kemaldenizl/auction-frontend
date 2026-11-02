"use client";

import { Gavel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGate } from "@/features/auth/components/require-auth";
import { PERMISSION } from "@/features/auth/model/permissions";
import { useFormSubmit } from "@/shared/hooks/use-form-submit";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
} from "@/shared/ui";

import { auctionApi } from "../api/auction-api";
import type { CreateAuctionDraft } from "../model/auction";

const MAX_DURATION_MINUTES = 10_080;

interface Draft {
  startingPrice: string;
  minimumIncrement: string;
  durationMinutes: string;
  startsAt: string;
}

/** `datetime-local` gives a local wall-clock string; the API wants UTC ISO. */
function toUtcIso(localValue: string): string | undefined {
  if (!localValue) return undefined;
  const parsed = new Date(localValue);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * Opens an auction for a product and jumps into its room.
 *
 * Every field except the product is optional — leaving one blank takes the
 * backend's default: the catalogue price, an increment of 100, 60 minutes,
 * and "starts now".
 */
export function CreateAuctionForm({
  productId,
  startingPrice,
}: {
  productId: string;
  startingPrice: number;
}) {
  const router = useRouter();
  const form = useFormSubmit();

  const [draft, setDraft] = useState<Draft>({
    startingPrice: String(startingPrice),
    minimumIncrement: "100",
    durationMinutes: "60",
    startsAt: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const create = form.submit(async () => {
    const duration = Number(draft.durationMinutes);
    const increment = Number(draft.minimumIncrement);
    const price = Number(draft.startingPrice);

    if ([duration, increment, price].some((value) => !(value > 0))) {
      setLocalError("Sayısal alanlar sıfırdan büyük olmalı.");
      return;
    }
    if (duration > MAX_DURATION_MINUTES) {
      setLocalError("Süre en fazla 7 gün (10080 dakika) olabilir.");
      return;
    }
    setLocalError(null);

    const body: CreateAuctionDraft = {
      productId,
      startingPrice: price,
      minimumIncrement: increment,
      durationMinutes: duration,
      startsAt: toUtcIso(draft.startsAt),
    };

    const auction = await auctionApi.createAuction(body);
    router.push(`/auctions/${auction.id}`);
    router.refresh();
  });

  return (
    // Regular visitors simply do not see this card.
    <PermissionGate permission={PERMISSION.auctionsManage}>
      <Card>
        <CardHeader
          icon={<Gavel />}
          title="Açık artırma başlat"
          description="Başlangıç zamanını boş bırakırsanız hemen yayına alınır."
        />
        <CardBody>
          <form onSubmit={create} className="space-y-4">
            {(localError ?? form.error) && (
              <Alert role="alert" tone="danger">
                {localError ?? form.error}
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="starting-price"
                label="Başlangıç fiyatı"
                error={form.fieldErrors.startingprice}
              >
                <Input
                  id="starting-price"
                  type="number"
                  min={1}
                  step="0.01"
                  value={draft.startingPrice}
                  onChange={(event) =>
                    update("startingPrice", event.target.value)
                  }
                  className="tabular"
                />
              </Field>

              <Field
                id="minimum-increment"
                label="Teklif adımı"
                hint="Her teklif en az bu kadar artar."
                error={form.fieldErrors.minimumincrement}
              >
                <Input
                  id="minimum-increment"
                  type="number"
                  min={1}
                  step="0.01"
                  value={draft.minimumIncrement}
                  onChange={(event) =>
                    update("minimumIncrement", event.target.value)
                  }
                  className="tabular"
                />
              </Field>

              <Field
                id="duration"
                label="Süre (dakika)"
                hint="En fazla 7 gün."
                error={form.fieldErrors.durationminutes}
              >
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={MAX_DURATION_MINUTES}
                  value={draft.durationMinutes}
                  onChange={(event) =>
                    update("durationMinutes", event.target.value)
                  }
                  className="tabular"
                />
              </Field>
            </div>

            <Field
              id="starts-at"
              label="Başlangıç zamanı"
              hint="İsteğe bağlı. Boş bırakırsanız hemen başlar."
              error={form.fieldErrors.startsat}
            >
              <Input
                id="starts-at"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) => update("startsAt", event.target.value)}
              />
            </Field>

            <Button type="submit" loading={form.pending}>
              Açık artırma oluştur
            </Button>
          </form>
        </CardBody>
      </Card>
    </PermissionGate>
  );
}
