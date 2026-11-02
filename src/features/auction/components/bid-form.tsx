"use client";

import { Gavel } from "lucide-react";
import { useState } from "react";

import { errorMessage, isApiError, messageForProblem } from "@/shared/api";
import { formatMoney } from "@/shared/lib/format";
import { Alert, Button, Field, Input, fieldDescriptionId } from "@/shared/ui";

import type { BidRejectedEvent } from "../model/hub-events";

const FIELD_ID = "bid-amount";

/** A refusal, whichever path reported it. */
interface BidProblem {
  message: string;
  minimumRequired: number | null;
}

/**
 * The live connection and the fallback request report a refusal with the same
 * `errorCode` and `minimumRequired`, so both render the same plain message.
 * The server's own wording is written for developers and never shown.
 */
function fromHubEvent(event: BidRejectedEvent): BidProblem {
  return {
    message: messageForProblem({
      status: 409,
      errorCode: event.errorCode,
      minimumRequired: event.minimumRequired,
    }),
    minimumRequired: event.minimumRequired,
  };
}

function fromThrown(error: unknown): BidProblem {
  return {
    message: errorMessage(error, "Teklifiniz gönderilemedi. Lütfen tekrar deneyin."),
    minimumRequired: isApiError(error) ? (error.minimumRequired ?? null) : null,
  };
}

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
  const [invalid, setInvalid] = useState<string | null>(null);
  const [thrown, setThrown] = useState<BidProblem | null>(null);

  // Convenience shortcuts, not a reimplementation of the bidding rule: each
  // one starts from the server's `minimumNextBid` and the server still has
  // the final say on whether the amount is accepted.
  const shortcuts = [
    { label: "En az", value: minimumNextBid },
    { label: "+1 adım", value: minimumNextBid + minimumIncrement },
    { label: "+5 adım", value: minimumNextBid + minimumIncrement * 5 },
  ];

  const problem = thrown ?? (rejection ? fromHubEvent(rejection) : null);

  function dismiss() {
    setThrown(null);
    onDismissRejection();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInvalid("Lütfen geçerli bir tutar girin.");
      return;
    }

    setInvalid(null);
    setThrown(null);
    setSending(true);
    try {
      await onSubmit(parsed);
      setAmount("");
    } catch (error) {
      setThrown(fromThrown(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field
        id={FIELD_ID}
        label="Teklifiniz"
        hint={
          disabled && disabledReason
            ? disabledReason
            : `En az ${formatMoney(minimumNextBid)} teklif verebilirsiniz.`
        }
        error={invalid}
      >
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-subtle"
          >
            ₺
          </span>
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
            aria-invalid={invalid !== null}
            aria-describedby={fieldDescriptionId(FIELD_ID, invalid !== null)}
            className="h-14 pl-9 text-lg font-semibold tabular"
          />
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            disabled={disabled || sending}
            onClick={() => setAmount(String(shortcut.value))}
            aria-label={`${shortcut.label}: ${formatMoney(shortcut.value)}`}
            className="rounded-xl border border-line bg-surface px-2 py-2 text-center transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand-soft/50 active:scale-95 disabled:pointer-events-none disabled:opacity-45 cursor-pointer"
          >
            <span className="block text-[11px] text-subtle">{shortcut.label}</span>
            <span className="block text-xs font-semibold tabular text-fg">
              {formatMoney(shortcut.value)}
            </span>
          </button>
        ))}
      </div>

      <Button
        type="submit"
        size="lg"
        loading={sending}
        disabled={disabled}
        className="w-full"
      >
        {!sending && <Gavel />}
        Teklif ver
      </Button>

      {problem && (
        <Alert
          role="alert"
          tone="warning"
          title="Teklifiniz kabul edilmedi"
          action={
            <div className="flex gap-2">
              {problem.minimumRequired !== null && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmount(String(problem.minimumRequired))}
                >
                  {formatMoney(problem.minimumRequired)} yap
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
                Kapat
              </Button>
            </div>
          }
        >
          {problem.message}
        </Alert>
      )}
    </form>
  );
}
