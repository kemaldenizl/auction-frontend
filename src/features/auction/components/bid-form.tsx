"use client";

import { useState } from "react";

import { formatMoney } from "@/shared/lib/format";
import { Alert, Button, Field, Input, fieldDescriptionId } from "@/shared/ui";

import type { BidRejectedEvent } from "../model/hub-events";

const FIELD_ID = "bid-amount";

export interface BidFormProps {
  /** The server's floor for the next bid. Shown as-is, never recomputed. */
  minimumNextBid: number;
  minimumIncrement: number;
  disabled: boolean;
  disabledReason?: string;
  rejection: BidRejectedEvent | null;
  onSubmit: (amount: number) => Promise<void>;
  onDismissRejection: () => void;
}

export function BidForm({
  minimumNextBid,
  minimumIncrement,
  disabled,
  disabledReason,
  rejection,
  onSubmit,
  onDismissRejection,
}: BidFormProps) {
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Convenience shortcuts, not a reimplementation of the bidding rule: each
  // one starts from the server's `minimumNextBid` and the server still has
  // the final say on whether the amount is accepted.
  const shortcuts = [
    { label: "En az", value: minimumNextBid },
    { label: "+1 artış", value: minimumNextBid + minimumIncrement },
    { label: "+5 artış", value: minimumNextBid + minimumIncrement * 5 },
  ];

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError("Geçerli bir tutar girin.");
      return;
    }

    setLocalError(null);
    setSending(true);
    try {
      await onSubmit(parsed);
      // Resolving only means the invocation left the client. Acceptance or
      // refusal arrives separately as BidPlaced / BidRejected.
      setAmount("");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Teklif gönderilemedi.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field
        id={FIELD_ID}
        label="Teklifiniz"
        hint={`En az ${formatMoney(minimumNextBid)} verebilirsiniz.`}
        error={localError}
      >
        <div className="flex gap-2">
          <Input
            id={FIELD_ID}
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={amount}
            placeholder={String(minimumNextBid)}
            onChange={(event) => setAmount(event.target.value)}
            disabled={disabled || sending}
            aria-describedby={fieldDescriptionId(FIELD_ID, localError !== null)}
            className="tabular"
          />
          <Button type="submit" loading={sending} disabled={disabled}>
            Teklif ver
          </Button>
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.label}
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || sending}
            onClick={() => setAmount(String(shortcut.value))}
          >
            {shortcut.label} · {formatMoney(shortcut.value)}
          </Button>
        ))}
      </div>

      {disabled && disabledReason && (
        <p className="text-xs text-subtle">{disabledReason}</p>
      )}

      {rejection && (
        <Alert
          role="alert"
          tone="danger"
          title="Teklif reddedildi"
          action={
            <div className="flex gap-2">
              {rejection.minimumRequired !== null && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmount(String(rejection.minimumRequired))}
                >
                  {formatMoney(rejection.minimumRequired)} yap
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismissRejection}
              >
                Kapat
              </Button>
            </div>
          }
        >
          <p>{rejection.reason}</p>
          <p className="mt-0.5 font-mono text-xs">{rejection.errorCode}</p>
        </Alert>
      )}
    </form>
  );
}
