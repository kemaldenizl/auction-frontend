"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { isApiError } from "@/shared/api";
import { Button, Field, Input } from "@/shared/ui";

import { auctionApi } from "../api/auction-api";

interface Draft {
  startingPrice: string;
  minimumIncrement: string;
  durationMinutes: string;
}

/**
 * Creates an auction for a product over REST, then navigates into its room.
 * From there, pressing "Başlat" is the easiest way to watch `AuctionStarted`
 * arrive over the hub.
 */
export function CreateAuctionForm({
  productId,
  startingPrice,
}: {
  productId: string;
  startingPrice: number;
}) {
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>({
    startingPrice: String(startingPrice),
    minimumIncrement: "10",
    durationMinutes: "10",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const numbers = {
      startingPrice: Number(draft.startingPrice),
      minimumIncrement: Number(draft.minimumIncrement),
      durationMinutes: Number(draft.durationMinutes),
    };

    if (Object.values(numbers).some((value) => !Number.isFinite(value) || value <= 0)) {
      setError("Tüm alanlar sıfırdan büyük olmalı.");
      return;
    }

    setSubmitting(true);
    try {
      const auction = await auctionApi.createAuction({ productId, ...numbers });
      router.push(`/auctions/${auction.id}`);
    } catch (cause) {
      setError(
        isApiError(cause)
          ? `${cause.errorCode}: ${cause.message}`
          : "Açık arttırma oluşturulamadı.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="starting-price" label="Başlangıç fiyatı">
          <Input
            id="starting-price"
            type="number"
            min={1}
            step="0.01"
            value={draft.startingPrice}
            onChange={(event) => update("startingPrice", event.target.value)}
            className="tabular"
          />
        </Field>
        <Field
          id="minimum-increment"
          label="Min. artış"
          hint="Teklif adımı"
        >
          <Input
            id="minimum-increment"
            type="number"
            min={1}
            step="0.01"
            value={draft.minimumIncrement}
            onChange={(event) => update("minimumIncrement", event.target.value)}
            className="tabular"
          />
        </Field>
        <Field id="duration" label="Süre (dakika)">
          <Input
            id="duration"
            type="number"
            min={1}
            value={draft.durationMinutes}
            onChange={(event) => update("durationMinutes", event.target.value)}
            className="tabular"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting}>
        Açık arttırma oluştur
      </Button>
    </form>
  );
}
